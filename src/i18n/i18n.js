import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      nav: {
        home: 'Home',
        teachers: 'Teachers',
        about: 'About',
        contact: 'Contact',
        pricing: 'Pricing',
        faq: 'FAQ',
        howItWorks: 'How It Works',
        login: 'Login',
        signup: 'Sign Up',
        dashboard: 'Dashboard',
        logout: 'Logout'
      },
      
      // Common
      common: {
        loading: 'Loading...',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        update: 'Update',
        submit: 'Submit',
        search: 'Search',
        filter: 'Filter',
        reset: 'Reset',
        close: 'Close',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        yes: 'Yes',
        no: 'No',
        confirm: 'Confirm',
        error: 'Error',
        success: 'Success',
        warning: 'Warning',
        info: 'Information'
      },
      
      // Home page
      home: {
        title: 'AI-Powered Teaching Platform',
        subtitle: 'Transform your teaching with artificial intelligence',
        description: 'Create engaging lessons, generate quizzes, and enhance student learning with our comprehensive AI teaching tools.',
        getStarted: 'Get Started',
        learnMore: 'Learn More',
        features: {
          lessonPlanner: {
            title: 'Smart Lesson Planner',
            description: 'Create comprehensive lesson plans with AI assistance'
          },
          quizGenerator: {
            title: 'Quiz Generator',
            description: 'Generate interactive quizzes automatically'
          },
          contentCreator: {
            title: 'Content Creator',
            description: 'Develop engaging educational content effortlessly'
          },
          analytics: {
            title: 'Learning Analytics',
            description: 'Track student progress with detailed insights'
          }
        }
      },
      
      // Authentication
      auth: {
        login: {
          title: 'Welcome Back',
          subtitle: 'Sign in to your account',
          email: 'Email Address',
          password: 'Password',
          rememberMe: 'Remember me',
          forgotPassword: 'Forgot your password?',
          loginButton: 'Sign In',
          noAccount: "Don't have an account?",
          signUpLink: 'Sign up here'
        },
        signup: {
          title: 'Create Account',
          subtitle: 'Join our teaching community',
          firstName: 'First Name',
          lastName: 'Last Name',
          email: 'Email Address',
          password: 'Password',
          confirmPassword: 'Confirm Password',
          acceptTerms: 'I accept the Terms and Conditions',
          signupButton: 'Create Account',
          haveAccount: 'Already have an account?',
          loginLink: 'Sign in here'
        },
        forgotPassword: {
          title: 'Reset Password',
          subtitle: 'Enter your email to reset password',
          email: 'Email Address',
          sendLink: 'Send Reset Link',
          backToLogin: 'Back to Login'
        }
      },
      
      // Dashboard
      dashboard: {
        welcome: 'Welcome back, {{name}}!',
        overview: 'Overview',
        quickActions: 'Quick Actions',
        recentActivity: 'Recent Activity',
        statistics: {
          totalLessons: 'Total Lessons',
          totalQuizzes: 'Total Quizzes',
          totalStudents: 'Total Students',
          completionRate: 'Completion Rate'
        },
        actions: {
          createLesson: 'Create New Lesson',
          generateQuiz: 'Generate Quiz',
          viewAnalytics: 'View Analytics',
          manageContent: 'Manage Content'
        }
      },
      
      // Lesson Planner
      lessonPlanner: {
        title: 'AI Lesson Planner',
        subtitle: 'Create engaging lessons with AI assistance',
        form: {
          subject: 'Subject',
          grade: 'Grade Level',
          topic: 'Topic',
          duration: 'Duration (minutes)',
          objectives: 'Learning Objectives',
          additionalNotes: 'Additional Notes',
          generateLesson: 'Generate Lesson Plan'
        },
        sections: {
          introduction: 'Introduction',
          mainContent: 'Main Content',
          activities: 'Activities',
          assessment: 'Assessment',
          homework: 'Homework',
          resources: 'Resources'
        }
      },
      
      // Quiz Generator
      quizGenerator: {
        title: 'AI Quiz Generator',
        subtitle: 'Create interactive quizzes automatically',
        form: {
          quizTitle: 'Quiz Title',
          subject: 'Subject',
          difficulty: 'Difficulty Level',
          questionCount: 'Number of Questions',
          questionTypes: 'Question Types',
          topic: 'Topic/Content',
          generateQuiz: 'Generate Quiz'
        },
        difficulty: {
          easy: 'Easy',
          medium: 'Medium',
          hard: 'Hard'
        },
        questionTypes: {
          multipleChoice: 'Multiple Choice',
          trueFalse: 'True/False',
          shortAnswer: 'Short Answer',
          essay: 'Essay'
        }
      },
      
      // Content Management
      content: {
        title: 'Content Management',
        subtitle: 'Manage your educational content',
        tabs: {
          lessons: 'Lessons',
          quizzes: 'Quizzes',
          resources: 'Resources',
          assignments: 'Assignments'
        },
        actions: {
          create: 'Create New',
          import: 'Import',
          export: 'Export',
          share: 'Share',
          duplicate: 'Duplicate',
          archive: 'Archive'
        },
        status: {
          draft: 'Draft',
          published: 'Published',
          archived: 'Archived',
          shared: 'Shared'
        }
      },
      
      // Analytics
      analytics: {
        title: 'Learning Analytics',
        subtitle: 'Track progress and performance',
        overview: {
          title: 'Overview',
          activeUsers: 'Active Users',
          contentViews: 'Content Views',
          completionRate: 'Completion Rate',
          averageScore: 'Average Score'
        },
        charts: {
          userActivity: 'User Activity',
          contentPerformance: 'Content Performance',
          engagementMetrics: 'Engagement Metrics',
          progressTracking: 'Progress Tracking'
        },
        filters: {
          dateRange: 'Date Range',
          subject: 'Subject',
          grade: 'Grade Level',
          content: 'Content Type'
        }
      },
      
      // Collaboration
      collaboration: {
        title: 'Collaboration',
        subtitle: 'Work together in real-time',
        participants: 'Participants',
        comments: 'Comments',
        versions: 'Versions',
        share: {
          title: 'Share Content',
          permissions: 'Permissions',
          canView: 'Can View',
          canEdit: 'Can Edit',
          canComment: 'Can Comment',
          shareLink: 'Share Link',
          copyLink: 'Copy Link'
        },
        comments: {
          addComment: 'Add Comment',
          reply: 'Reply',
          resolve: 'Resolve',
          resolved: 'Resolved'
        }
      },
      
      // Settings
      settings: {
        title: 'Settings',
        subtitle: 'Manage your preferences',
        sections: {
          profile: 'Profile',
          account: 'Account',
          notifications: 'Notifications',
          language: 'Language',
          privacy: 'Privacy',
          security: 'Security'
        },
        profile: {
          firstName: 'First Name',
          lastName: 'Last Name',
          email: 'Email',
          bio: 'Bio',
          school: 'School/Institution',
          subject: 'Primary Subject',
          experience: 'Years of Experience'
        },
        language: {
          selectLanguage: 'Select Language',
          autoDetect: 'Auto-detect from browser'
        },
        notifications: {
          emailNotifications: 'Email Notifications',
          pushNotifications: 'Push Notifications',
          weeklyDigest: 'Weekly Digest',
          newFeatures: 'New Features',
          collaborationUpdates: 'Collaboration Updates'
        }
      },
      
      // Errors and Messages
      errors: {
        networkError: 'Network error. Please check your connection.',
        serverError: 'Server error. Please try again later.',
        notFound: 'The requested resource was not found.',
        unauthorized: 'You are not authorized to access this resource.',
        forbidden: 'Access to this resource is forbidden.',
        validationError: 'Please check your input and try again.',
        unknownError: 'An unknown error occurred.'
      },
      
      messages: {
        saveSuccess: 'Saved successfully!',
        updateSuccess: 'Updated successfully!',
        deleteSuccess: 'Deleted successfully!',
        createSuccess: 'Created successfully!',
        shareSuccess: 'Shared successfully!',
        copySuccess: 'Copied to clipboard!',
        uploadSuccess: 'Upload successful!',
        loginSuccess: 'Login successful!',
        logoutSuccess: 'Logout successful!',
        passwordResetSent: 'Password reset link sent to your email.'
      },
      
      // Footer
      footer: {
        company: 'Company',
        aboutUs: 'About Us',
        careers: 'Careers',
        contact: 'Contact',
        support: 'Support',
        helpCenter: 'Help Center',
        documentation: 'Documentation',
        community: 'Community',
        legal: 'Legal',
        privacy: 'Privacy Policy',
        terms: 'Terms of Service',
        cookies: 'Cookie Policy',
        copyright: '© {{year}} TeachAI. All rights reserved.',
        followUs: 'Follow Us'
      }
    }
  },
  es: {
    translation: {
      // Navigation
      nav: {
        home: 'Inicio',
        teachers: 'Profesores',
        about: 'Acerca de',
        contact: 'Contacto',
        pricing: 'Precios',
        faq: 'FAQ',
        howItWorks: 'Cómo Funciona',
        login: 'Iniciar Sesión',
        signup: 'Registrarse',
        dashboard: 'Panel',
        logout: 'Cerrar Sesión'
      },
      
      // Common
      common: {
        loading: 'Cargando...',
        save: 'Guardar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        edit: 'Editar',
        create: 'Crear',
        update: 'Actualizar',
        submit: 'Enviar',
        search: 'Buscar',
        filter: 'Filtrar',
        reset: 'Restablecer',
        close: 'Cerrar',
        back: 'Atrás',
        next: 'Siguiente',
        previous: 'Anterior',
        yes: 'Sí',
        no: 'No',
        confirm: 'Confirmar',
        error: 'Error',
        success: 'Éxito',
        warning: 'Advertencia',
        info: 'Información'
      },
      
      // Home page
      home: {
        title: 'Plataforma de Enseñanza con IA',
        subtitle: 'Transforma tu enseñanza con inteligencia artificial',
        description: 'Crea lecciones atractivas, genera cuestionarios y mejora el aprendizaje de los estudiantes con nuestras herramientas integrales de enseñanza con IA.',
        getStarted: 'Comenzar',
        learnMore: 'Saber Más',
        features: {
          lessonPlanner: {
            title: 'Planificador de Lecciones Inteligente',
            description: 'Crea planes de lección completos con asistencia de IA'
          },
          quizGenerator: {
            title: 'Generador de Cuestionarios',
            description: 'Genera cuestionarios interactivos automáticamente'
          },
          contentCreator: {
            title: 'Creador de Contenido',
            description: 'Desarrolla contenido educativo atractivo sin esfuerzo'
          },
          analytics: {
            title: 'Análisis de Aprendizaje',
            description: 'Rastrea el progreso del estudiante con perspectivas detalladas'
          }
        }
      },
      
      // Authentication
      auth: {
        login: {
          title: 'Bienvenido de Nuevo',
          subtitle: 'Inicia sesión en tu cuenta',
          email: 'Dirección de Correo',
          password: 'Contraseña',
          rememberMe: 'Recordarme',
          forgotPassword: '¿Olvidaste tu contraseña?',
          loginButton: 'Iniciar Sesión',
          noAccount: '¿No tienes una cuenta?',
          signUpLink: 'Regístrate aquí'
        },
        signup: {
          title: 'Crear Cuenta',
          subtitle: 'Únete a nuestra comunidad de enseñanza',
          firstName: 'Nombre',
          lastName: 'Apellido',
          email: 'Dirección de Correo',
          password: 'Contraseña',
          confirmPassword: 'Confirmar Contraseña',
          acceptTerms: 'Acepto los Términos y Condiciones',
          signupButton: 'Crear Cuenta',
          haveAccount: '¿Ya tienes una cuenta?',
          loginLink: 'Inicia sesión aquí'
        },
        forgotPassword: {
          title: 'Restablecer Contraseña',
          subtitle: 'Ingresa tu correo para restablecer la contraseña',
          email: 'Dirección de Correo',
          sendLink: 'Enviar Enlace de Restablecimiento',
          backToLogin: 'Volver al Inicio de Sesión'
        }
      },
      
      // Dashboard
      dashboard: {
        welcome: '¡Bienvenido de nuevo, {{name}}!',
        overview: 'Resumen',
        quickActions: 'Acciones Rápidas',
        recentActivity: 'Actividad Reciente',
        statistics: {
          totalLessons: 'Lecciones Totales',
          totalQuizzes: 'Cuestionarios Totales',
          totalStudents: 'Estudiantes Totales',
          completionRate: 'Tasa de Finalización'
        },
        actions: {
          createLesson: 'Crear Nueva Lección',
          generateQuiz: 'Generar Cuestionario',
          viewAnalytics: 'Ver Análisis',
          manageContent: 'Gestionar Contenido'
        }
      },
      
      // Continue with more Spanish translations...
      errors: {
        networkError: 'Error de red. Por favor, verifica tu conexión.',
        serverError: 'Error del servidor. Inténtalo de nuevo más tarde.',
        notFound: 'El recurso solicitado no fue encontrado.',
        unauthorized: 'No estás autorizado para acceder a este recurso.',
        forbidden: 'El acceso a este recurso está prohibido.',
        validationError: 'Por favor, verifica tu entrada e inténtalo de nuevo.',
        unknownError: 'Ocurrió un error desconocido.'
      }
    }
  },
  fr: {
    translation: {
      // Navigation
      nav: {
        home: 'Accueil',
        teachers: 'Professeurs',
        about: 'À propos',
        contact: 'Contact',
        pricing: 'Tarifs',
        faq: 'FAQ',
        howItWorks: 'Comment ça marche',
        login: 'Connexion',
        signup: "S'inscrire",
        dashboard: 'Tableau de bord',
        logout: 'Déconnexion'
      },
      
      // Common
      common: {
        loading: 'Chargement...',
        save: 'Enregistrer',
        cancel: 'Annuler',
        delete: 'Supprimer',
        edit: 'Modifier',
        create: 'Créer',
        update: 'Mettre à jour',
        submit: 'Soumettre',
        search: 'Rechercher',
        filter: 'Filtrer',
        reset: 'Réinitialiser',
        close: 'Fermer',
        back: 'Retour',
        next: 'Suivant',
        previous: 'Précédent',
        yes: 'Oui',
        no: 'Non',
        confirm: 'Confirmer',
        error: 'Erreur',
        success: 'Succès',
        warning: 'Avertissement',
        info: 'Information'
      },
      
      // Home page
      home: {
        title: "Plateforme d'Enseignement IA",
        subtitle: "Transformez votre enseignement avec l'intelligence artificielle",
        description: "Créez des leçons attrayantes, générez des quiz et améliorez l'apprentissage des étudiants avec nos outils d'enseignement IA complets.",
        getStarted: 'Commencer',
        learnMore: 'En savoir plus',
        features: {
          lessonPlanner: {
            title: 'Planificateur de Leçons Intelligent',
            description: 'Créez des plans de leçon complets avec assistance IA'
          },
          quizGenerator: {
            title: 'Générateur de Quiz',
            description: 'Générez des quiz interactifs automatiquement'
          },
          contentCreator: {
            title: 'Créateur de Contenu',
            description: 'Développez du contenu éducatif engageant sans effort'
          },
          analytics: {
            title: "Analyse d'Apprentissage",
            description: 'Suivez les progrès des étudiants avec des insights détaillés'
          }
        }
      },
      
      // Authentication
      auth: {
        login: {
          title: 'Bon Retour',
          subtitle: 'Connectez-vous à votre compte',
          email: 'Adresse e-mail',
          password: 'Mot de passe',
          rememberMe: 'Se souvenir de moi',
          forgotPassword: 'Mot de passe oublié?',
          loginButton: 'Se connecter',
          noAccount: "Vous n'avez pas de compte?",
          signUpLink: 'Inscrivez-vous ici'
        }
      },
      
      errors: {
        networkError: 'Erreur réseau. Veuillez vérifier votre connexion.',
        serverError: 'Erreur serveur. Veuillez réessayer plus tard.',
        notFound: 'La ressource demandée est introuvable.',
        unauthorized: "Vous n'êtes pas autorisé à accéder à cette ressource.",
        forbidden: "L'accès à cette ressource est interdit.",
        validationError: 'Veuillez vérifier votre saisie et réessayer.',
        unknownError: 'Une erreur inconnue est survenue.'
      }
    }
  }
};

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },

    interpolation: {
      escapeValue: false // React already does escaping
    },

    react: {
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i']
    }
  });

export default i18n;