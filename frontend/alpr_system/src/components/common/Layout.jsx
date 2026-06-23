import Sidebar from './Sidebar'

export default function Layout({ children, title }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="ml-56 flex-1 p-8 min-h-screen">
        {title && (
          <h1 className="font-display text-2xl font-bold text-primary mb-8 tracking-wide">
            {title}
          </h1>
        )}
        <div className="animate-slide-up">{children}</div>
      </main>
    </div>
  )
}