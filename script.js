// === РАБОЧИЙ КОД БЕЗ FIREBASE (работает локально) ===
// Используем локальное хранилище для демо

// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===
let currentUser = null;
let onlineUsers = [];
let chats = [];
let currentChatId = null;
let selectedAvatar = 1;

// Демо-пользователи (будут в реальном времени)
const demoUsers = [
    { id: 'user1', name: 'Алексей Иванов', avatar: 1, online: true },
    { id: 'user2', name: 'Мария Петрова', avatar: 2, online: true },
    { id: 'user3', name: 'Иван Сидоров', avatar: 3, online: true },
    { id: 'user4', name: 'Ольга Кузнецова', avatar: 4, online: false },
    { id: 'user5', name: 'Дмитрий Смирнов', avatar: 1, online: true }
];

// === ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('Forsic запускается...');
    
    // Проверяем сохраненного пользователя
    const savedUser = localStorage.getItem('forsic_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            showNotification(`С возвращением, ${currentUser.name}!`, 'success');
            updateUI();
            loadOnlineUsers();
            loadChats();
        } catch (e) {
            console.error('Ошибка загрузки пользователя:', e);
            showLoginModal();
        }
    } else {
        showLoginModal();
    }
    
    setupEventListeners();
});

// === ПОКАЗАТЬ МОДАЛЬНОЕ ОКНО ВХОДА ===
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPhone').value = '';
}

// === АВТОРИЗАЦИЯ ===
function login() {
    console.log('Попытка входа...');
    
    const usernameInput = document.getElementById('loginUsername');
    const phoneInput = document.getElementById('loginPhone');
    
    const username = usernameInput.value.trim();
    const phone = phoneInput.value.trim();
    
    console.log('Введено:', { username, phone, selectedAvatar });
    
    // Валидация
    if (!username) {
        showNotification('Введите ваше имя', 'error');
        usernameInput.focus();
        return;
    }
    
    if (!phone) {
        showNotification('Введите номер телефона', 'error');
        phoneInput.focus();
        return;
    }
    
    // Создаем пользователя
    currentUser = {
        id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: username,
        phone: phone,
        avatar: selectedAvatar,
        online: true,
        lastSeen: new Date().toISOString()
    };
    
    console.log('Создан пользователь:', currentUser);
    
    // Сохраняем
    localStorage.setItem('forsic_user', JSON.stringify(currentUser));
    
    // Добавляем в онлайн пользователи
    onlineUsers.push({
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        online: true
    });
    
    // Обновляем UI
    updateUI();
    
    // Скрываем модальное окно
    document.getElementById('loginModal').style.display = 'none';
    
    // Показываем уведомление
    showNotification(`Добро пожаловать в Forsic, ${username}!`, 'success');
    
    // Загружаем данные
    loadOnlineUsers();
    loadChats();
}

// === ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ===
function updateUI() {
    if (!currentUser) return;
    
    console.log('Обновление UI для пользователя:', currentUser.name);
    
    // Обновляем информацию о пользователе
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userStatus').textContent = 'онлайн';
    document.getElementById('userAvatar').innerHTML = getAvatarIcon(currentUser.avatar);
    
    // Обновляем меню
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.querySelector('.menu-item[onclick*="chats"]').classList.add('active');
    
    // Показываем чаты
    showSection('chats');
}

// === УПРАВЛЕНИЕ ЧАТАМИ ===
function loadChats() {
    console.log('Загрузка чатов...');
    
    // Загружаем из localStorage или создаем демо
    const savedChats = localStorage.getItem('forsic_chats');
    
    if (savedChats) {
        try {
            chats = JSON.parse(savedChats);
        } catch (e) {
            console.error('Ошибка загрузки чатов:', e);
            chats = createDemoChats();
        }
    } else {
        chats = createDemoChats();
        localStorage.setItem('forsic_chats', JSON.stringify(chats));
    }
    
    updateChatsList();
}

function createDemoChats() {
    return [
        {
            id: 'chat1',
            partner: {
                id: 'user1',
                name: 'Алексей Иванов',
                avatar: 1,
                online: true
            },
            lastMessage: 'Привет! Как дела?',
            lastTime: '12:30',
            unread: 2,
            messages: [
                { id: 1, text: 'Привет! Как дела?', time: '12:30', sender: 'user1', outgoing: false },
                { id: 2, text: 'Привет! Хорошо, а у тебя?', time: '12:31', sender: 'me', outgoing: true }
            ]
        },
        {
            id: 'chat2',
            partner: {
                id: 'user2',
                name: 'Мария Петрова',
                avatar: 2,
                online: true
            },
            lastMessage: 'Жду тебя завтра в 18:00',
            lastTime: '10:15',
            unread: 0,
            messages: [
                { id: 1, text: 'Жду тебя завтра в 18:00', time: '10:15', sender: 'user2', outgoing: false },
                { id: 2, text: 'Хорошо, буду!', time: '10:16', sender: 'me', outgoing: true }
            ]
        }
    ];
}

function updateChatsList() {
    const mainContent = document.getElementById('mainContent');
    
    if (!currentChatId) {
        mainContent.innerHTML = `
            <div class="chats-container">
                <div class="chats-header">
                    <h2>Чаты</h2>
                    <button class="btn-primary" onclick="startNewChat()">
                        <i class="fas fa-plus"></i> Новый чат
                    </button>
                </div>
                <div class="chats-list">
                    ${chats.map(chat => `
                        <div class="chat-item" onclick="openChat('${chat.id}')">
                            <div class="avatar">
                                ${getAvatarIcon(chat.partner.avatar)}
                                ${chat.partner.online ? '<span class="online-badge"></span>' : ''}
                            </div>
                            <div class="chat-info">
                                <div class="chat-header-info">
                                    <h4>${chat.partner.name}</h4>
                                    <span class="chat-time">${chat.lastTime}</span>
                                </div>
                                <div class="last-message">${chat.lastMessage}</div>
                                ${chat.unread > 0 ? `<span class="unread-count">${chat.unread}</span>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

function openChat(chatId) {
    console.log('Открываем чат:', chatId);
    
    currentChatId = chatId;
    const chat = chats.find(c => c.id === chatId);
    
    if (!chat) {
        console.error('Чат не найден:', chatId);
        return;
    }
    
    // Показываем правую панель
    document.getElementById('chatSidebar').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
    
    // Обновляем информацию
    document.getElementById('chatPartnerName').textContent = chat.partner.name;
    document.getElementById('chatPartnerStatus').textContent = chat.partner.online ? 'онлайн' : 'был(а) недавно';
    document.getElementById('chatPartnerAvatar').innerHTML = getAvatarIcon(chat.partner.avatar);
    
    // Загружаем сообщения
    loadMessages(chat.messages);
    
    // Активируем ввод
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    messageInput.disabled = false;
    messageInput.placeholder = `Сообщение для ${chat.partner.name}...`;
    sendBtn.disabled = false;
    messageInput.focus();
    
    // Сбрасываем непрочитанные
    chat.unread = 0;
    updateChatsList();
}

function closeChat() {
    currentChatId = null;
    document.getElementById('chatSidebar').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    updateChatsList();
}

function loadMessages(messages) {
    const container = document.getElementById('chatMessages');
    container.innerHTML = '';
    
    messages.forEach(msg => {
        const isOutgoing = msg.sender === 'me';
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isOutgoing ? 'message-outgoing' : 'message-incoming'}`;
        
        messageDiv.innerHTML = `
            <div class="message-content">
                ${!isOutgoing ? `<div class="message-sender">${msg.sender === 'me' ? 'Вы' : 'Собеседник'}</div>` : ''}
                <div class="message-text">${msg.text}</div>
                <div class="message-time">${msg.time}</div>
            </div>
        `;
        
        container.appendChild(messageDiv);
    });
    
    // Прокрутка вниз
    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text || !currentChatId) {
        console.log('Не могу отправить: нет текста или чата');
        return;
    }
    
    console.log('Отправка сообщения:', text);
    
    const chat = chats.find(c => c.id === currentChatId);
    if (!chat) {
        console.error('Чат не найден:', currentChatId);
        return;
    }
    
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Добавляем сообщение
    chat.messages.push({
        id: Date.now(),
        text: text,
        time: time,
        sender: 'me',
        outgoing: true
    });
    
    // Обновляем последнее сообщение
    chat.lastMessage = text;
    chat.lastTime = time;
    
    // Сохраняем
    localStorage.setItem('forsic_chats', JSON.stringify(chats));
    
    // Обновляем UI
    loadMessages(chat.messages);
    updateChatsList();
    
    // Очищаем поле
    input.value = '';
    input.focus();
    
    // Имитация ответа (только для демо-пользователей)
    if (chat.partner.id.startsWith('user')) {
        setTimeout(() => {
            const replies = [
                'Интересно! Расскажи подробнее',
                'Согласен с тобой',
                'Давай обсудим это позже',
                'Спасибо за информацию!',
                'Отличная мысль!',
                'Понял тебя',
                'Давай встретимся',
                'Посмотрю и отвечу',
                'Хорошо, договорились',
                'Отлично!'
            ];
            const reply = replies[Math.floor(Math.random() * replies.length)];
            
            chat.messages.push({
                id: Date.now(),
                text: reply,
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                sender: chat.partner.id,
                outgoing: false
            });
            
            chat.lastMessage = reply;
            chat.lastTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            // Сохраняем
            localStorage.setItem('forsic_chats', JSON.stringify(chats));
            
            // Обновляем UI
            loadMessages(chat.messages);
            updateChatsList();
            
            // Уведомление если чат не активен
            if (currentChatId !== chat.id) {
                showNotification(`Новое сообщение от ${chat.partner.name}`, 'message');
            }
        }, 1000 + Math.random() * 2000);
    }
}

// === УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ===
function loadOnlineUsers() {
    console.log('Загрузка онлайн пользователей...');
    
    // Используем демо-пользователей + текущего пользователя
    onlineUsers = [...demoUsers];
    
    // Добавляем текущего пользователя если он есть
    if (currentUser && !onlineUsers.find(u => u.id === currentUser.id)) {
        onlineUsers.push({
            id: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar,
            online: true
        });
    }
    
    // Обновляем счетчик
    const onlineCount = onlineUsers.filter(u => u.online).length;
    document.getElementById('onlineCount').textContent = onlineCount;
    
    console.log('Онлайн пользователи:', onlineUsers);
}

function updateUsersList() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    const filteredUsers = onlineUsers.filter(user => 
        user.id !== currentUser.id && user.online
    );
    
    if (filteredUsers.length === 0) {
        usersList.innerHTML = `
            <div class="no-users">
                <i class="fas fa-user-slash"></i>
                <p>Нет онлайн пользователей</p>
            </div>
        `;
        return;
    }
    
    usersList.innerHTML = filteredUsers.map(user => `
        <div class="user-item" onclick="startChatWithUser('${user.id}')">
            <div class="avatar">
                ${getAvatarIcon(user.avatar)}
            </div>
            <div class="user-info">
                <h4>${user.name}</h4>
                <div class="user-status">онлайн</div>
            </div>
            <div class="online-badge"></div>
        </div>
    `).join('');
}

function startNewChat() {
    console.log('Создание нового чата...');
    document.getElementById('newChatModal').style.display = 'flex';
    updateUsersList();
}

function startChatWithUser(userId) {
    console.log('Начинаем чат с пользователем:', userId);
    
    const user = onlineUsers.find(u => u.id === userId);
    if (!user) {
        showNotification('Пользователь не найден', 'error');
        return;
    }
    
    // Проверяем, есть ли уже чат
    let chat = chats.find(c => c.partner.id === userId);
    
    if (!chat) {
        // Создаем новый чат
        const chatId = 'chat_' + Date.now();
        
        chat = {
            id: chatId,
            partner: {
                id: userId,
                name: user.name,
                avatar: user.avatar,
                online: user.online
            },
            lastMessage: 'Начало переписки',
            lastTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            unread: 0,
            messages: []
        };
        
        chats.push(chat);
        
        // Сохраняем
        localStorage.setItem('forsic_chats', JSON.stringify(chats));
    }
    
    // Закрываем модальное окно
    closeModal('newChatModal');
    
    // Открываем чат
    openChat(chat.id);
}

// === НАСТРОЙКИ ===
function showSettingsTab(tab) {
    const content = document.getElementById('settingsContent');
    if (!content) return;
    
    const tabs = {
        account: `
            <div class="setting-item">
                <div class="setting-label">Имя пользователя</div>
                <div class="setting-value">${currentUser.name}</div>
            </div>
            <div class="setting-item">
                <div class="setting-label">Номер телефона</div>
                <div class="setting-value">${currentUser.phone}</div>
            </div>
            <div class="setting-item">
                <div class="setting-label">Статус</div>
                <div class="setting-value">онлайн</div>
            </div>
            <button class="btn-secondary" onclick="editProfile()" style="margin-top: 20px;">
                Редактировать профиль
            </button>
        `,
        privacy: `
            <div class="setting-item">
                <div class="setting-label">Последний раз в сети</div>
                <div class="setting-value">
                    <label class="switch">
                        <input type="checkbox" checked>
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
            <div class="setting-item">
                <div class="setting-label">Фотография профиля</div>
                <div class="setting-value">Все</div>
            </div>
            <div class="setting-item">
                <div class="setting-label">Пересылка сообщений</div>
                <div class="setting-value">Все</div>
            </div>
        `,
        notifications: `
            <div class="setting-item">
                <div class="setting-label">Звук уведомлений</div>
                <div class="setting-value">
                    <label class="switch">
                        <input type="checkbox" checked>
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
            <div class="setting-item">
                <div class="setting-label">Вибросигнал</div>
                <div class="setting-value">
                    <label class="switch">
                        <input type="checkbox" checked>
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
            <div class="setting-item">
                <div class="setting-label">Предпросмотр сообщений</div>
                <div class="setting-value">
                    <label class="switch">
                        <input type="checkbox" checked>
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
        `,
        appearance: `
            <div class="setting-item">
                <div class="setting-label">Темная тема</div>
                <div class="setting-value">
                    <label class="switch">
                        <input type="checkbox" checked onchange="toggleTheme(this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
            <div class="setting-item">
                <div class="setting-label">Размер шрифта</div>
                <div class="setting-value">Средний</div>
            </div>
            <div class="setting-item">
                <div class="setting-label">Анимации</div>
                <div class="setting-value">
                    <label class="switch">
                        <input type="checkbox" checked>
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
        `
    };
    
    content.innerHTML = tabs[tab] || '<p>Настройки не найдены</p>';
    
    // Обновляем активную вкладку
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const clickedTab = event.target.closest('.tab');
    if (clickedTab) {
        clickedTab.classList.add('active');
    }
}

function showSection(section) {
    console.log('Показываем секцию:', section);
    
    const mainContent = document.getElementById('mainContent');
    
    const sections = {
        chats: () => {
            updateChatsList();
        },
        contacts: () => {
            mainContent.innerHTML = `
                <div class="chats-container">
                    <div class="chats-header">
                        <h2>Контакты</h2>
                        <button class="btn-primary" onclick="startNewChat()">
                            <i class="fas fa-user-plus"></i> Добавить контакт
                        </button>
                    </div>
                    <div class="contacts-list">
                        ${onlineUsers.filter(u => u.id !== currentUser?.id).map(user => `
                            <div class="contact-item">
                                <div class="avatar">
                                    ${getAvatarIcon(user.avatar)}
                                    ${user.online ? '<span class="online-badge"></span>' : ''}
                                </div>
                                <div class="contact-info">
                                    <h4>${user.name}</h4>
                                    <p class="contact-status">${user.online ? 'онлайн' : 'оффлайн'}</p>
                                </div>
                                <button class="btn-secondary" onclick="startChatWithUser('${user.id}')">
                                    Написать
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        },
        groups: () => {
            mainContent.innerHTML = `
                <div class="chats-container">
                    <h2>Группы</h2>
                    <div style="text-align: center; padding: 50px;">
                        <i class="fas fa-users" style="font-size: 60px; color: var(--primary-color); margin-bottom: 20px;"></i>
                        <h3>Скоро появятся</h3>
                        <p>Групповые чаты будут доступны в следующем обновлении</p>
                    </div>
                </div>
            `;
        },
        settings: () => {
            document.getElementById('settingsModal').style.display = 'flex';
            showSettingsTab('account');
        },
        themes: () => {
            mainContent.innerHTML = `
                <div class="chats-container">
                    <h2>Темы оформления</h2>
                    <div class="themes-grid">
                        <div class="theme-item" onclick="changeTheme('dark')">
                            <div class="theme-preview dark-theme"></div>
                            <h4>Темная</h4>
                            <p>Классическая тема Forsic</p>
                        </div>
                        <div class="theme-item" onclick="changeTheme('light')">
                            <div class="theme-preview light-theme"></div>
                            <h4>Светлая</h4>
                            <p>Яркая и чистая</p>
                        </div>
                        <div class="theme-item" onclick="changeTheme('blue')">
                            <div class="theme-preview blue-theme"></div>
                            <h4>Синяя</h4>
                            <p>Спокойная и профессиональная</p>
                        </div>
                        <div class="theme-item" onclick="changeTheme('purple')">
                            <div class="theme-preview purple-theme"></div>
                            <h4>Фиолетовая</h4>
                            <p>Креативная и современная</p>
                        </div>
                    </div>
                </div>
            `;
        }
    };
    
    if (sections[section]) {
        sections[section]();
    }
    
    // Обновляем активный пункт меню
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick')?.includes(section)) {
            item.classList.add('active');
        }
    });
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
function selectAvatar(number) {
    console.log('Выбран аватар:', number);
    selectedAvatar = number;
    document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
    event.target.closest('.avatar-option').classList.add('selected');
}

function getAvatarIcon(number) {
    const icons = [
        '<i class="fas fa-user"></i>',
        '<i class="fas fa-user-tie"></i>',
        '<i class="fas fa-user-graduate"></i>',
        '<i class="fas fa-user-ninja"></i>'
    ];
    return icons[number - 1] || icons[0];
}

function showNotification(message, type = 'info') {
    console.log('Уведомление:', message, type);
    
    const container = document.getElementById('notificationsContainer');
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('forsic_user');
        currentUser = null;
        showNotification('Вы вышли из системы', 'info');
        showLoginModal();
    }
}

function editProfile() {
    const newName = prompt('Введите новое имя:', currentUser.name);
    if (newName && newName.trim()) {
        currentUser.name = newName.trim();
        localStorage.setItem('forsic_user', JSON.stringify(currentUser));
        updateUI();
        showNotification('Профиль обновлен', 'success');
    }
}

function changeTheme(theme) {
    const themes = {
        dark: { background: '#0d1117', sidebar: '#161b22', primary: '#0088cc' },
        light: { background: '#ffffff', sidebar: '#f8f9fa', primary: '#0088cc' },
        blue: { background: '#0a192f', sidebar: '#112240', primary: '#64ffda' },
        purple: { background: '#1a1a2e', sidebar: '#16213e', primary: '#e94560' }
    };
    
    const themeConfig = themes[theme] || themes.dark;
    
    // Изменяем CSS переменные
    document.documentElement.style.setProperty('--background', themeConfig.background);
    document.documentElement.style.setProperty('--sidebar-bg', themeConfig.sidebar);
    document.documentElement.style.setProperty('--primary-color', themeConfig.primary);
    
    showNotification(`Тема "${theme}" применена`, 'success');
}

function toggleTheme(isDark) {
    if (isDark) {
        changeTheme('dark');
    } else {
        changeTheme('light');
    }
}

// === НАСТРОЙКА СОБЫТИЙ ===
function setupEventListeners() {
    console.log('Настройка событий...');
    
    // Отправка сообщения по Enter
    document.addEventListener('keypress', function(e) {
        if (e.target.id === 'messageInput' && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Вход по Enter в модальном окне
    document.getElementById('loginUsername')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            login();
        }
    });
    
    document.getElementById('loginPhone')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            login();
        }
    });
    
    // Поиск пользователей
    document.addEventListener('input', function(e) {
        if (e.target.id === 'searchUsers') {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('.user-item').forEach(item => {
                const name = item.querySelector('h4')?.textContent.toLowerCase();
                if (name && name.includes(query)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        }
    });
    
    // Клик вне модального окна
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.style.display = 'none';
        }
    });
    
    console.log('События настроены');
}

// === ЗАПУСК РЕАЛЬНОГО ВРЕМЕНИ ===
// Обновляем статус онлайн каждые 30 секунд
setInterval(() => {
    if (currentUser) {
        loadOnlineUsers();
        document.getElementById('onlineCount').textContent = 
            onlineUsers.filter(u => u.online).length;
    }
}, 30000);

console.log('Forsic готов к работе!');