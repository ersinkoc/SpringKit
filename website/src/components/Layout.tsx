import { Outlet } from 'react-router-dom'
import { ScrollArea } from './ui/scroll-area'

export function Layout() {
  return (
    <div className="lg:pl-64">
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="container max-w-4xl py-8 px-4 md:px-8">
          <Outlet />
        </div>
      </ScrollArea>
    </div>
  )
}
