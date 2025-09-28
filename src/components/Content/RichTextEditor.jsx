import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { EditorState, convertToRaw, convertFromRaw, ContentState } from 'draft-js';
import { Editor as DraftEditor } from 'react-draft-wysiwyg';
import { stateToHTML } from 'draft-js-export-html';
import { stateFromHTML } from 'draft-js-import-html';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import './RichTextEditor.css';

const RichTextEditor = ({
  value = '',
  onChange,
  format = 'html', // html, markdown, draft-js
  placeholder = 'Start writing...',
  readOnly = false,
  height = 400,
  toolbar = 'full', // minimal, basic, full, custom
  customToolbar = null,
  autoSave = false,
  autoSaveInterval = 30000, // 30 seconds
  onAutoSave,
  className = '',
  editorRef,
  plugins = [],
  features = {
    wordCount: true,
    characterCount: true,
    readingTime: true,
    spellCheck: true,
    autoComplete: true,
    codeView: true,
    fullScreen: true,
    tables: true,
    media: true,
    links: true,
    mentions: false,
    hashtags: false
  }
}) => {
  const [editorType, setEditorType] = useState('tinymce'); // tinymce, draft-js
  const [draftEditorState, setDraftEditorState] = useState(EditorState.createEmpty());
  const [stats, setStats] = useState({
    words: 0,
    characters: 0,
    charactersWithSpaces: 0,
    readingTime: 0
  });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showCodeView, setShowCodeView] = useState(false);
  const [codeValue, setCodeValue] = useState('');
  
  const editorContainerRef = useRef(null);
  const tinyMCERef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const lastContentRef = useRef(value);

  // Initialize Draft.js editor state from value
  useEffect(() => {
    if (format === 'draft-js' && value) {
      try {
        const contentState = typeof value === 'string' 
          ? stateFromHTML(value)
          : convertFromRaw(value);
        setDraftEditorState(EditorState.createWithContent(contentState));
      } catch (error) {
        console.error('Error parsing Draft.js content:', error);
      }
    }
  }, [value, format]);

  // Calculate content statistics
  const calculateStats = (content) => {
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    const words = plainText ? plainText.split(/\s+/).length : 0;
    const characters = plainText.length;
    const charactersWithSpaces = content.replace(/<[^>]*>/g, '').length;
    const readingTime = Math.ceil(words / 200); // Average reading speed

    return {
      words,
      characters,
      charactersWithSpaces,
      readingTime
    };
  };

  // Update stats when content changes
  useEffect(() => {
    if (value) {
      setStats(calculateStats(value));
    }
  }, [value]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && onAutoSave) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(() => {
        if (lastContentRef.current !== value && value) {
          onAutoSave(value);
          lastContentRef.current = value;
        }
      }, autoSaveInterval);

      return () => {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }
      };
    }
  }, [value, autoSave, onAutoSave, autoSaveInterval]);

  // TinyMCE configuration
  const getTinyMCEConfig = () => {
    const basePlugins = [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'table', 'help', 'wordcount'
    ];

    const fullToolbar = [
      'undo redo | blocks | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify',
      'bullist numlist outdent indent | removeformat | link image table | code fullscreen help'
    ];

    const basicToolbar = [
      'undo redo | bold italic | alignleft aligncenter alignright | bullist numlist | link'
    ];

    const minimalToolbar = [
      'bold italic | link'
    ];

    let toolbarConfig;
    switch (toolbar) {
      case 'minimal':
        toolbarConfig = minimalToolbar;
        break;
      case 'basic':
        toolbarConfig = basicToolbar;
        break;
      case 'custom':
        toolbarConfig = customToolbar;
        break;
      default:
        toolbarConfig = fullToolbar;
    }

    return {
      height,
      menubar: toolbar === 'full',
      plugins: [...basePlugins, ...plugins].join(' '),
      toolbar: toolbarConfig.join(' | '),
      content_style: `
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          font-size: 16px; 
          line-height: 1.6;
          color: #333;
        }
        p { margin-bottom: 1em; }
        h1, h2, h3, h4, h5, h6 { margin: 1.5em 0 0.5em 0; }
        blockquote { 
          border-left: 3px solid #ccc; 
          margin: 1em 0; 
          padding-left: 1em; 
          color: #666; 
        }
        code { 
          background: #f5f5f5; 
          padding: 2px 4px; 
          border-radius: 3px; 
          font-family: 'Monaco', 'Courier New', monospace; 
        }
        pre { 
          background: #f5f5f5; 
          padding: 1em; 
          border-radius: 5px; 
          overflow-x: auto; 
        }
        table { border-collapse: collapse; width: 100%; }
        table td, table th { border: 1px solid #ddd; padding: 8px; }
        table th { background-color: #f2f2f2; }
      `,
      branding: false,
      statusbar: features.wordCount,
      resize: !isFullScreen,
      setup: (editor) => {
        if (editorRef) {
          editorRef.current = editor;
        }
        tinyMCERef.current = editor;

        // Custom full screen toggle
        if (features.fullScreen) {
          editor.ui.registry.addButton('customfullscreen', {
            text: 'Fullscreen',
            onAction: () => toggleFullScreen()
          });
        }

        // Auto-complete setup
        if (features.autoComplete) {
          editor.ui.registry.addAutocompleter('mentions', {
            ch: '@',
            minChars: 1,
            fetch: (pattern) => {
              return new Promise((resolve) => {
                // Mock user mentions - replace with actual API call
                const users = [
                  { value: 'john_doe', text: 'John Doe' },
                  { value: 'jane_smith', text: 'Jane Smith' }
                ];
                const filtered = users.filter(user => 
                  user.text.toLowerCase().indexOf(pattern.toLowerCase()) !== -1
                );
                resolve(filtered);
              });
            },
            onAction: (autocompleteApi, rng, value) => {
              editor.selection.setRng(rng);
              editor.insertContent(`<span class="mention">@${value}</span>&nbsp;`);
              autocompleteApi.hide();
            }
          });
        }

        // Spell check
        if (features.spellCheck) {
          editor.getBody().setAttribute('spellcheck', 'true');
        }
      },
      init_instance_callback: (editor) => {
        // Additional initialization if needed
      }
    };
  };

  // Draft.js toolbar configuration
  const getDraftToolbarConfig = () => {
    const baseConfig = {
      options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'link', 'history'],
      inline: { inDropdown: false },
      list: { inDropdown: false },
      textAlign: { inDropdown: false },
      link: { inDropdown: false },
      history: { inDropdown: false }
    };

    switch (toolbar) {
      case 'minimal':
        return {
          options: ['inline'],
          inline: {
            options: ['bold', 'italic']
          }
        };
      case 'basic':
        return {
          options: ['inline', 'list', 'link'],
          inline: { options: ['bold', 'italic', 'underline'] },
          list: { options: ['unordered', 'ordered'] }
        };
      case 'custom':
        return customToolbar || baseConfig;
      default:
        return baseConfig;
    }
  };

  // Handle TinyMCE content change
  const handleTinyMCEChange = (content) => {
    onChange(content);
  };

  // Handle Draft.js content change
  const handleDraftChange = (editorState) => {
    setDraftEditorState(editorState);
    
    const contentState = editorState.getCurrentContent();
    let content;
    
    if (format === 'draft-js') {
      content = convertToRaw(contentState);
    } else {
      content = stateToHTML(contentState);
    }
    
    onChange(content);
  };

  // Toggle full screen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    
    if (!isFullScreen) {
      if (editorContainerRef.current && editorContainerRef.current.requestFullscreen) {
        editorContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Toggle code view
  const toggleCodeView = () => {
    if (!showCodeView) {
      setCodeValue(value);
    } else {
      onChange(codeValue);
    }
    setShowCodeView(!showCodeView);
  };

  // Handle code view changes
  const handleCodeChange = (e) => {
    setCodeValue(e.target.value);
  };

  const editorClasses = [
    'rich-text-editor',
    className,
    isFullScreen ? 'fullscreen' : '',
    readOnly ? 'readonly' : '',
    showCodeView ? 'code-view' : ''
  ].filter(Boolean).join(' ');

  return (
    <div ref={editorContainerRef} className={editorClasses}>
      {/* Editor Header */}
      <div className="editor-header">
        <div className="editor-controls">
          {/* Editor Type Switcher */}
          <div className="editor-type-switcher">
            <button
              type="button"
              className={`type-button ${editorType === 'tinymce' ? 'active' : ''}`}
              onClick={() => setEditorType('tinymce')}
              disabled={readOnly}
            >
              Rich Editor
            </button>
            <button
              type="button"
              className={`type-button ${editorType === 'draft-js' ? 'active' : ''}`}
              onClick={() => setEditorType('draft-js')}
              disabled={readOnly}
            >
              Block Editor
            </button>
          </div>

          {/* Additional Controls */}
          <div className="editor-actions">
            {features.codeView && (
              <button
                type="button"
                className={`action-button ${showCodeView ? 'active' : ''}`}
                onClick={toggleCodeView}
                title="Toggle Code View"
              >
                <span className="icon">📝</span>
                Code
              </button>
            )}
            {features.fullScreen && (
              <button
                type="button"
                className={`action-button ${isFullScreen ? 'active' : ''}`}
                onClick={toggleFullScreen}
                title="Toggle Fullscreen"
              >
                <span className="icon">⛶</span>
                Fullscreen
              </button>
            )}
          </div>
        </div>

        {/* Content Statistics */}
        {features.wordCount && (
          <div className="editor-stats">
            <span className="stat">Words: {stats.words}</span>
            <span className="stat">Characters: {stats.characters}</span>
            {features.readingTime && (
              <span className="stat">Reading time: {stats.readingTime} min</span>
            )}
          </div>
        )}
      </div>

      {/* Editor Content */}
      <div className="editor-content">
        {showCodeView ? (
          <textarea
            className="code-editor"
            value={codeValue}
            onChange={handleCodeChange}
            placeholder="Enter HTML/Markdown code..."
            readOnly={readOnly}
            style={{ height: `${height}px` }}
          />
        ) : (
          <>
            {editorType === 'tinymce' ? (
              <Editor
                apiKey="your-tinymce-api-key" // Replace with your TinyMCE API key
                value={value}
                init={getTinyMCEConfig()}
                onEditorChange={handleTinyMCEChange}
                disabled={readOnly}
              />
            ) : (
              <DraftEditor
                editorState={draftEditorState}
                onEditorStateChange={handleDraftChange}
                placeholder={placeholder}
                readOnly={readOnly}
                toolbar={getDraftToolbarConfig()}
                wrapperClassName="draft-wrapper"
                editorClassName="draft-editor"
                toolbarClassName="draft-toolbar"
                editorStyle={{ minHeight: `${height - 100}px` }}
              />
            )}
          </>
        )}
      </div>

      {/* Editor Footer */}
      <div className="editor-footer">
        {autoSave && (
          <div className="autosave-indicator">
            <span className="autosave-icon">💾</span>
            Auto-save enabled
          </div>
        )}
        
        {features.spellCheck && (
          <div className="spell-check-indicator">
            <span className="spell-check-icon">✓</span>
            Spell check active
          </div>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor;