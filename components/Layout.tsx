import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  header: React.ReactNode;
  bottomNav?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, header, bottomNav }) => {
  return (
    <div className="flex flex-col h-screen bg-[#fcfbf9] text-gray-900 overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-none z-10 bg-[#fcfbf9]/90 backdrop-blur-md border-b border-gray-100/50">
        {header}
      </div>

      {/* Scrollable Main Content */}
      <main className="flex-grow overflow-y-auto no-scrollbar scroll-smooth">
        <div className="max-w-3xl mx-auto px-6 py-8 pb-32">
          {children}
        </div>
      </main>
      
      {/* Floating or Fixed Bottom Element */}
      {bottomNav && (
        <div className="fixed bottom-0 left-0 right-0 z-20">
          <div className="max-w-3xl mx-auto">
             {bottomNav}
          </div>
        </div>
      )}
    </div>
  );
};
