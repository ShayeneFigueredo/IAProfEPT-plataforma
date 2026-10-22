import sys

path = r"C:\apps\IAProfEPT\PLATAFORMA\src\components\Sidebar.jsx"

with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

target = "className={`sidebar-nav-item ${currentTab === 'repositorio' ? 'active' : ''}`}"
btn = """className={`sidebar-nav-item ${currentTab === 'chat' ? 'active' : ''}`}
            onClick={() => handleNavClick('chat')}
          >
            <div className="sidebar-nav-left">
              <MessageSquare size={18} />
              <span>Chat IA</span>
            </div>
          </button>

          <button
            """ + target

if target in text:
    text = text.replace(target, btn)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Success")
else:
    print("Target not found")

