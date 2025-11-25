import React, { useContext, Suspense, useMemo } from 'react'
import Aside from './Aside'
import { UserContext } from '../../context/UserContext'
import { Route, Routes, Navigate, useLocation, Link } from 'react-router-dom'
// Providers are applied at a higher level (App.jsx)
import ErrorBoundary from '../common/ErrorBoundary'
import Spinner from '../common/Spinner'

// Lazy-loaded route components to reduce initial bundle size
const Chatbots = React.lazy(() => import('./components/Chatbots'))
const LessonPlanner = React.lazy(() => import('../Chatbots/LessonPlanner/LessonPlanner'))
const Quiz = React.lazy(() => import('../Chatbots/Quiz/Quiz'))
const Essay = React.lazy(() => import('../Chatbots/Essay/Essay'))
const LessonComprehension = React.lazy(() => import('../Chatbots/LessonComprehension/LessonComprehension'))
const MathQuiz = React.lazy(() => import('../Chatbots/MathQuiz/MathQuiz'))
const MathLessonPlanner = React.lazy(() => import('../Chatbots/MathLessonPlanner/MathLessonPlanner'))
const VideoToNotes = React.lazy(() => import('../Chatbots/VideoToNotes/VideoToNotes'))
const VideoToQuiz = React.lazy(() => import('../Chatbots/VideoToQuiz/VideoToQuiz'))
const DetectAI = React.lazy(() => import('../Chatbots/DetectAI/DetectAI'))
const PowerPoint = React.lazy(() => import('../Chatbots/PowerPoint/PowerPoint'))
const Settings = React.lazy(() => import('./Settings/Settings'))

const UserDashboard = () => {

	const { isAuthenticated } = useContext(UserContext)
	const location = useLocation()

	const title = useMemo(() => {
		const path = location.pathname.replace(/.*\/user\/dashboard\/?/, '')
		if (!path || path === '') return 'Overview'
		if (path.startsWith('chatbot/lesson-planner')) return 'Lesson Planner'
		if (path.startsWith('chatbot/quiz')) return 'Quiz'
		if (path.startsWith('chatbot/essay')) return 'Essay'
		if (path.startsWith('chatbot/lessonComp')) return 'Lesson Comprehension'
		if (path.startsWith('chatbot/mathquiz')) return 'Math Quiz'
		if (path.startsWith('chatbot/math-lesson-planner')) return 'Math Lesson Planner'
		if (path.startsWith('chatbot/video-summarize')) return 'Video Summarize'
		if (path.startsWith('chatbot/video-to-quiz')) return 'Video to Quiz'
		if (path.startsWith('chatbot/detect-ai')) return 'Detect AI'
		if (path.startsWith('chatbot/powerpoint-presentation')) return 'PowerPoint'
		if (path.startsWith('settings')) return 'Settings'
		if (path.startsWith('chatbots')) return 'Chatbots'
		return 'Dashboard'
	}, [location.pathname])

	// Explicit tri-state handling: if false -> redirect to login; if null/undefined -> show loading
	if (isAuthenticated === false) return <Navigate to="/login" replace />
	if (isAuthenticated == null) return (
		<div className="flex items-center justify-center min-h-screen" aria-live="polite">
			<Spinner message="Loading dashboard..." />
		</div>
	)

	const routes = [
		{ path: 'chatbots', element: <Chatbots /> },
		{ path: 'chatbot/lesson-planner', element: <LessonPlanner /> },
		{ path: 'chatbot/quiz', element: <Quiz /> },
		{ path: 'chatbot/essay', element: <Essay /> },
		{ path: 'chatbot/lessonComp', element: <LessonComprehension /> },
		{ path: 'chatbot/mathquiz', element: <MathQuiz /> },
		{ path: 'chatbot/math-lesson-planner', element: <MathLessonPlanner /> },
		{ path: 'chatbot/video-summarize', element: <VideoToNotes /> },
		{ path: 'chatbot/video-to-quiz', element: <VideoToQuiz /> },
		{ path: 'chatbot/detect-ai', element: <DetectAI /> },
		{ path: 'chatbot/powerpoint-presentation', element: <PowerPoint /> },
		{ path: 'settings', element: <Settings /> },
	]


	return (
		<div className='max-w-[1640px] mx-auto px-4'>
			<div className="flex flex-col md:flex-row gap-6">
				<aside className="md:w-72 md:mt-20 md:sticky md:top-20">
					<Aside />
				</aside>

				<main className="flex-1 mt-6 md:mt-20" aria-label="User dashboard main">
					<div className="mb-4">
						<div className="flex items-center justify-between">
							<div>
								<nav className="text-sm text-gray-500 mb-1" aria-label="Breadcrumb">
									<Link to="/user/dashboard" className="hover:underline">Dashboard</Link>
									<span className="mx-2">/</span>
									<span className="text-gray-700">{title}</span>
								</nav>
								<h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
							</div>
							<div className="flex items-center gap-3">
								<Link to="/user/dashboard/chatbots" className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm">New Chat</Link>
								<Link to="/user/dashboard/settings" className="border px-3 py-2 rounded-md text-sm">Settings</Link>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow-sm p-4 min-h-[60vh]">
						<ErrorBoundary>
							<Suspense fallback={<Spinner message="Loading section..." />}>
								<Routes>
									<Route index element={<Navigate to="chatbots" replace />} />
									{routes.map(r => (
										<Route key={r.path} path={r.path} element={r.element} />
									))}
									<Route path="*" element={<div className="p-6 text-center">Section not found. <Link to="chatbots" className="text-blue-600 underline">Go to Chatbots</Link></div>} />
								</Routes>
							</Suspense>
						</ErrorBoundary>
					</div>
				</main>
			</div>
		</div>
	)
}

export default UserDashboard