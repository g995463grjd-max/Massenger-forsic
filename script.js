// === НАСТРОЙКИ FIREBASE ===
const firebaseConfig = {
    apiKey: "AIzaSyDummyApiKeyForDemoOnly123",
    authDomain: "forsic-chat.firebaseapp.com",
    databaseURL: "https://forsic-chat-default-rtdb.firebaseio.com",
    projectId: "forsic-chat",
    storageBucket: "forsic-chat.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===
let currentUser = null;
let onlineUsers = [];
let chats = [];
let currentChatId = null;
let selectedAvatar = 1;

// === ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, есть ли сохраненный пользователь
    const savedUser = localStorage.getItem('forsic_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUI();
    } else {
        // Показываем окно входа
        document.getElementById('loginModal').style.display = 'flex';
    }
    
    setupEventListeners();
    loadChats();
});

// === АВТОРИЗАЦИЯ ===
function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const phone = document.getElementById('loginPhone').value.trim();
    
    if (!username || !phone) {
        showNotification('Заполните все поля', 'error');
        return;
    }
    
    // Создаем пользователя
    currentUser = {
        id: generateUserId(),
        name: username,
        phone: phone,
        avatar: selectedAvatar,
        online: true,
        lastSeen: new Date().toISOString()
    };
    
    // Сохраняем в localStorage
    localStorage.setItem('forsic_user', JSON.stringify(currentUser));
    
    // Сохраняем в Firebase
    database.ref('users/' + currentUser.id).set({
        name: currentUser.name,
        phone: currentUser.phone,
        avatar: currentUser.avatar,
        online: true,
        lastSeen: new Date().toISOString()
    });
    
    // Обновляем UI
    updateUI();
    document.getElementById('loginModal').style.display = 'none';
    showNotification(`Добро пожаловать, ${username}!`, 'success');
    
    // Загружаем онлайн пользователей
    loadOnlineUsers();
}

function logout() {
    if (currentUser) {
        // Помечаем как оффлайн в Firebase
        database.ref('users/' + currentUser.id).update({
            online: false,
            lastSeen: new Date().toISOString()
        });
    }
    
    // Очищаем данные
    localStorage.removeItem('forsic_user');
    currentUser = null;
    
    // Показываем окно входа
    document.getElementById('loginModal').style.display = 'flex';
    showNotification('Вы вышли из системы', 'info');
}

// === ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ===
function updateUI() {
    if (!currentUser) return;
    
    // Обновляем информацию о пользователе
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userStatus').textContent = 'онлайн';
    document.getElementById('userAvatar').innerHTML = getAvatarIcon(currentUser.avatar);
    
    // Обновляем аватар в модальном окне
    const avatarElement = document.querySelector(`.avatar-option:nth-child(${currentUser.avatar})`);
    if (avatarElement) {
        document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
        avatarElement.classList.add('selected');
    }
}

// === УПРАВЛЕНИЕ ЧАТАМИ ===
function loadChats() {
    // В реальном приложении здесь загрузка из Firebase
    // Пока используем демо-данные
    chats = [
        {
            id: 'chat1',
            partner: {
                id: 'user2',
                name: 'Алексей Иванов',
                avatar: 2,
                online: true
            },
            lastMessage: 'Привет! Как дела?',
            lastTime: '12:30',
            unread: 2,
            messages: [
                { id: 1, text: 'Привет! Как дела?', time: '12:30', sender: 'user2', outgoing: false },
                { id: 2, text: 'Привет! Хорошо, а у тебя?', time: '12:31', sender: 'me', outgoing: true }
            ]
        },
        {
            id: 'chat2',
            partner: {
                id: 'user3',
                name: 'Мария Петрова',
                avatar: 3,
                online: true
            },
            lastMessage: 'Жду тебя завтра в 18:00',
            lastTime: '10:15',
            unread: 0,
            messages: [
                { id: 1, text: 'Жду тебя завтра в 18:00', time: '10:15', sender: 'user3', outgoing: false },
                { id: 2, text: 'Хорошо, буду!', time: '10:16', sender: 'me', outgoing: true }
            ]
        }
    ];
    
    updateChatsList();
}

function updateChatsList() {
    const mainContent = document.getElementById('mainContent');
    
    // Если нет активного чата, показываем список
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
    currentChatId = chatId;
    const chat = chats.find(c => c.id === chatId);
    
    if (!chat) return;
    
    // Показываем правую панель чата
    document.getElementById('chatSidebar').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
    
    // Обновляем информацию о собеседнике
    document.getElementById('chatPartnerName').textContent = chat.partner.name;
    document.getElementById('chatPartnerStatus').textContent = chat.partner.online ? 'онлайн' : 'был(а) недавно';
    document.getElementById('chatPartnerAvatar').innerHTML = getAvatarIcon(chat.partner.avatar);
    
    // Загружаем сообщения
    loadMessages(chat.messages);
    
    // Активируем поле ввода
    document.getElementById('messageInput').disabled = false;
    document.getElementById('sendBtn').disabled = false;
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
    
    // Прокручиваем вниз
    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text || !currentChatId) return;
    
    const chat = chats.find(c => c.id === currentChatId);
    if (!chat) return;
    
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
    
    // В реальном приложении здесь отправка в Firebase
    if (chat.partner.id.startsWith('user')) {
        // Сохраняем в Firebase для реальных пользователей
        database.ref('messages/' + currentChatId).push({
            text: text,
            sender: currentUser.id,
            receiver: chat.partner.id,
            time: time,
            timestamp: Date.now()
        });
    }
    
    // Обновляем UI
    loadMessages(chat.messages);
    updateChatsList();
    
    // Очищаем поле ввода
    input.value = '';
    input.focus();
    
    // Имитация ответа для демо-пользователей
    if (chat.partner.id.startsWith('user')) {
        setTimeout(() => {
            const replies = [
                'Интересно! Расскажи подробнее',
                'Согласен с тобой',
                'Давай обсудим это позже',
                'Спасибо за информацию!',
                'Отличная мысль!'
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
            
            loadMessages(chat.messages);
            updateChatsList();
            showNotification(`Новое сообщение от ${chat.partner.name}`, 'message');
        }, 1000 + Math.random() * 2000);
    }
}

// === УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ===
function loadOnlineUsers() {
    // Загружаем реальных пользователей из Firebase
    database.ref('users').on('value', (snapshot) => {
        const users = snapshot.val();
        onlineUsers = [];
        
        if (users) {
            Object.keys(users).forEach(userId => {
                if (userId !== currentUser.id && users[userId].online) {
                    onlineUsers.push({
                        id: userId,
                        name: users[userId].name,
                        avatar: users[userId].avatar,
                        online: true
                    });
                }
            });
        }
        
        // Обновляем счетчик
        document.getElementById('onlineCount').textContent = onlineUsers.length;
        
        // Обновляем список в модальном окне
        updateUsersList();
    });
}

function updateUsersList() {
    const usersList = document.getElementById('usersList');
    
    if (onlineUsers.length === 0) {
        usersList.innerHTML = `
            <div class="no-users">
                <i class="fas fa-user-slash"></i>
                <p>Нет онлайн пользователей</p>
            </div>
        `;
        return;
    }
    
    usersList.innerHTML = onlineUsers.map(user => `
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
    document.getElementById('newChatModal').style.display = 'flex';
    loadOnlineUsers();
}

function startChatWithUser(userId) {
    const user = onlineUsers.find(u => u.id === userId);
    if (!user) return;
    
    // Создаем новый чат
    const chatId = `chat_${currentUser.id}_${userId}`;
    
    const newChat = {
        id: chatId,
        partner: {
            id: userId,
            name: user.name,
            avatar: user.avatar,
            online: true
        },
        lastMessage: 'Начало переписки',
        lastTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        unread: 0,
        messages: []
    };
    
    // Добавляем в список чатов
    if (!chats.find(c => c.id === chatId)) {
        chats.push(newChat);
    }
    
    // Закрываем модальное окно
    closeModal('newChatModal');
    
    // Открываем чат
    openChat(chatId);
}

// === НАСТРОЙКИ ===
function showSettingsTab(tab) {
    const content = document.getElementById('settingsContent');
    
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
            <button class="btn-secondary" onclick="editProfile()">
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
                        <input type="checkbox" checked>
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
    
    content.innerHTML = tabs[tab] || '';
    
    // Обновляем активную вкладку
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
}

function showSection(section) {
    const sections = {
        chats: () => {
            updateChatsList();
        },
        contacts: () => {
            document.getElementById('mainContent').innerHTML = `
                <div class="chats-container">
                    <div class="chats-header">
                        <h2>Контакты</h2>
                        <button class="btn-primary" onclick="startNewChat()">
                            <i class="fas fa-user-plus"></i> Добавить контакт
                        </button>
                    </div>
                    <div class="contacts-list">
                        ${onlineUsers.map(user => `
                            <div class="contact-item">
                                <div class="avatar">
                                    ${getAvatarIcon(user.avatar)}
                                    <span class="online-badge"></span>
                                </div>
                                <div class="contact-info">
                                    <h4>${user.name}</h4>
                                    <p class="contact-status">онлайн</p>
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
        settings: () => {
            document.getElementById('settingsModal').style.display = 'flex';
            showSettingsTab('account');
        },
        themes: () => {
            document.getElementById('mainContent').innerHTML = `
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
    selectedAvatar = number;
    document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
    event.target.classList.add('selected');
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

function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function showNotification(message, type = 'info') {
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

function setupEventListeners() {
    // Отправка сообщения по Enter
    document.getElementById('messageInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Поиск пользователей
    document.getElementById('searchUsers')?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('.user-item').forEach(item => {
            const name = item.querySelector('h4').textContent.toLowerCase();
            item.style.display = name.includes(query) ? 'flex' : 'none';
        });
    });
}

// === ЗАГРУЗКА РЕАЛЬНЫХ ПОЛЬЗОВАТЕЛЕЙ ===
// Этот код запускается при успешном входе
function initRealTimeUpdates() {
    // Слушаем новые сообщения
    database.ref('messages').on('child_added', (snapshot) => {
        const message = snapshot.val();
        
        // Если сообщение адресовано текущему пользователю
        if (message.receiver === currentUser.id) {
            // Находим или создаем чат
            let chat = chats.find(c => c.partner.id === message.sender);
            
            if (!chat) {
                // Загружаем информацию об отправителе
                database.ref('users/' + message.sender).once('value').then(userSnapshot => {
                    const user = userSnapshot.val();
                    if (user) {
                        chat = {
                            id: `chat_${message.sender}_${currentUser.id}`,
                            partner: {
                                id: message.sender,
                                name: user.name,
                                avatar: user.avatar,
                                online: user.online
                            },
                            lastMessage: message.text,
                            lastTime: message.time,
                            unread: 1,
                            messages: []
                        };
                        
                        chats.push(chat);
                        
                        // Показываем уведомление
                        showNotification(`Новое сообщение от ${user.name}`, 'message');
                        
                        // Обновляем список чатов
                        updateChatsList();
                    }
                });
            }
        }
    });
}

// Запускаем при успешном входе
setTimeout(() => {
    if (currentUser) {
        loadOnlineUsers();
        initRealTimeUpdates();
    }
}, 1000);