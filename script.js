class DevTaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('devTasks')) || [];
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderTasks();
        this.updateStats();
    }

    bindEvents() {
    // Form submission
    document.getElementById('taskForm').addEventListener('submit', (e) => {
        e.preventDefault();
        this.addTask();
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            this.setFilter(e.target.dataset.filter);
        });
    });

    // Search input
    document.getElementById('searchInput').addEventListener('input', (e) => {
        this.searchTerm = e.target.value.toLowerCase();
        this.renderTasks();
    });

    // Task list events (using event delegation) - FIXED VERSION
    document.getElementById('tasksList').addEventListener('change', (e) => {
        if (e.target.matches('.task-complete')) {
            const taskItem = e.target.closest('.task-item');
            const taskId = parseInt(taskItem.dataset.taskId);
            this.toggleTask(taskId);
        }
    });

    // Separate click handler for buttons
    document.getElementById('tasksList').addEventListener('click', (e) => {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;

        const taskId = parseInt(taskItem.dataset.taskId);

        if (e.target.matches('.delete-btn') || e.target.closest('.delete-btn')) {
            this.deleteTask(taskId);
        } else if (e.target.matches('.edit-btn') || e.target.closest('.edit-btn')) {
            this.editTask(taskId);
        }
    });
}

    addTask() {
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const priority = document.getElementById('taskPriority').value;
        const category = document.getElementById('taskCategory').value;

        if (!title) {
            this.showNotification('Please enter a task title', 'error');
            return;
        }

        const task = {
            id: Date.now(),
            title,
            description,
            priority,
            category,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.clearForm();
        this.showNotification('Task added successfully! 🚀', 'success');
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            
            const message = task.completed ? 'Task completed! ✅' : 'Task reopened! 🔄';
            this.showNotification(message, 'success');
        }
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification('Task deleted! 🗑️', 'success');
        }
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        const newTitle = prompt('Edit task title:', task.title);
        if (newTitle !== null && newTitle.trim()) {
            task.title = newTitle.trim();
            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.renderTasks();
            this.showNotification('Task updated! ✏️', 'success');
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderTasks();
    }

    getFilteredTasks() {
        let filteredTasks = this.tasks;

        // Apply status filter
        if (this.currentFilter === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        } else if (this.currentFilter === 'pending') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        }

        // Apply search filter
        if (this.searchTerm) {
            filteredTasks = filteredTasks.filter(task => 
                task.title.toLowerCase().includes(this.searchTerm) ||
                task.description.toLowerCase().includes(this.searchTerm) ||
                task.category.toLowerCase().includes(this.searchTerm)
            );
        }

        return filteredTasks;
    }

    renderTasks() {
        const tasksList = document.getElementById('tasksList');
        const emptyState = document.getElementById('emptyState');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            tasksList.style.display = 'none';
            emptyState.style.display = 'block';
            
            if (this.searchTerm) {
                emptyState.innerHTML = `
                    <i class="fas fa-search"></i>
                    <h3>No tasks found</h3>
                    <p>Try adjusting your search term or filters</p>
                `;
            } else if (this.currentFilter === 'completed') {
                emptyState.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <h3>No completed tasks</h3>
                    <p>Complete some tasks to see them here</p>
                `;
            } else if (this.currentFilter === 'pending') {
                emptyState.innerHTML = `
                    <i class="fas fa-clock"></i>
                    <h3>No pending tasks</h3>
                    <p>All tasks are completed! 🎉</p>
                `;
            } else {
                emptyState.innerHTML = `
                    <i class="fas fa-code-branch"></i>
                    <h3>No tasks in your pipeline</h3>
                    <p>Add your first development task to get started!</p>
                `;
            }
            return;
        }

        tasksList.style.display = 'block';
        emptyState.style.display = 'none';

        tasksList.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
    }

    createTaskHTML(task) {
        const categoryIcons = {
            frontend: '🎨',
            backend: '⚙️',
            database: '🗄️',
            testing: '🧪',
            deployment: '🚀',
            documentation: '📝',
            bug: '🐛',
            feature: '✨',
            learning: '📚',
            exercise: '🏃',
            gaming: '🎮',
            sleeping: '😴',
            reading: '📖',
            meeting: '👥',
            personal: '👤',
            shopping: '🛒',
            cooking: '🍳',
            entertainment: '🎬',
            others:''
        };

        const priorityEmojis = {
            high: '🔴',
            medium: '🟡',
            low: '🟢'
        };

        const createdDate = new Date(task.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-checkbox">
                        <input type="checkbox" class="task-complete" ${task.completed ? 'checked' : ''}>
                        <span class="checkmark"></span>
                    </div>
                    <div class="task-info">
                        <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
                        ${task.description ? `<p class="task-description">${this.escapeHtml(task.description)}</p>` : ''}
                    </div>
                    <div class="task-badges">
                        <span class="priority-badge ${task.priority}">
                            ${priorityEmojis[task.priority]} ${task.priority.toUpperCase()}
                        </span>
                        <span class="category-badge">
                            ${categoryIcons[task.category]} ${task.category.toUpperCase()}
                        </span>
                    </div>
                </div>
                <div class="task-footer">
                    <span class="task-date">Created: ${createdDate}</span>
                    <div class="task-actions">
                        <button class="edit-btn" title="Edit Task">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" title="Delete Task">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
    }

    clearForm() {
        document.getElementById('taskForm').reset();
    }

    saveTasks() {
        localStorage.setItem('devTasks', JSON.stringify(this.tasks));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'error' ? '#ff5252' : '#00d4aa',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.9rem',
            fontWeight: '500',
            zIndex: '1000',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        });

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Animate out and remove
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DevTaskManager();
});

// some sample tasks (only if no tasks exist)
window.addEventListener('load', () => {
    const existingTasks = JSON.parse(localStorage.getItem('devTasks')) || [];
    if (existingTasks.length === 0) {
        const sampleTasks = [
            {
                id: Date.now() - 3,
                title: "Implement user authentication system",
                description: "Set up JWT-based authentication with login/register functionality",
                priority: "high",
                category: "backend",
                completed: false,
                createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
                updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
            },
            {
                id: Date.now() - 2,
                title: "Design responsive navigation component",
                description: "Create a mobile-friendly navigation bar with dropdown menus",
                priority: "medium",
                category: "frontend",
                completed: true,
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: Date.now() - 1,
                title: "Write unit tests for API endpoints",
                description: "Add comprehensive test coverage for all REST API routes",
                priority: "high",
                category: "testing",
                completed: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        
        localStorage.setItem('devTasks', JSON.stringify(sampleTasks));
        window.location.reload(); // Reload to show sample tasks
    }
});