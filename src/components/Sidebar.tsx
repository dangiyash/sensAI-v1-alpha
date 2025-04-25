'use client';

import { Bot, Users, FileText, Map, Video } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { name: 'AI Mentor', icon: Bot, path: '/chatbot' },
  { name: 'Community', icon: Users, path: '/community' },
  { name: 'Assessment', icon: FileText, path: '/assessment' },
  { name: 'Pathway', icon: Map, path: '/pathway' },
  { name: 'Live Mentor', icon: Video, path: '/live-mentor' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-gray-800 text-white p-4">
      <h1 className="text-2xl font-bold mb-6">Edutard</h1>
      <nav>
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.path}
            className={`flex items-center p-2 mb-2 rounded ${
              pathname === item.path ? 'bg-gray-700' : 'hover:bg-gray-700'
            }`}
          >
            <item.icon className="mr-2" />
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}