// Task management functions - Updated Nov 3, 2025
// API_URL is loaded from config.js
let allTasks = [];
let showCompleted = false; // Toggle state for showing/hiding completed tasks

async function addTask() {
    const taskInput = document.getElementById('taskInput');
    const taskdate = document.getElementById('date');
    const priority = document.getElementById('priority').value;
        let category = document.getElementById('category').value;
    const customCategory = document.getElementById('customCategory');
    const notes = document.getElementById('taskNotes').value;
    const recurrence = document.getElementById('recurrence').value;

    if (taskInput.value.trim() === "") {
        alert("Please enter a task.");
        return;
    }

    // Use custom category if selected
    if (category === 'custom') {
        if (customCategory.value.trim() === '') {
            alert("Please enter a custom category.");
            return;
        }
        category = customCategory.value.trim().toLowerCase();
    }

    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                text: taskInput.value,
                date: taskdate.value || null,
                completed: false,
                priority: priority,
                category: category,
                notes: notes || null,
                recurrence: recurrence
            })
        });

        if (response.ok) {
            const task = await response.json();
            allTasks.push(task);
            renderTasks();

            taskInput.value = "";
            taskdate.value = "";
            document.getElementById('priority').value = "medium";
            document.getElementById('category').value = "personal";
            document.getElementById('taskNotes').value = "";
            document.getElementById('recurrence').value = "none";
            document.getElementById('customCategory').value = "";
            document.getElementById('customCategory').style.display = "none";
        } else {
            alert('Failed to add task');
        }
    } catch (error) {
        alert('Error connecting to server');
    }
}

async function updateTask(taskId, updates) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(updates)
        });

        if (response.ok) {
            // Update local task
            const taskIndex = allTasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                allTasks[taskIndex] = { ...allTasks[taskIndex], ...updates };
                
                // Only update the specific task element instead of re-rendering everything
                if (updates.completed !== undefined) {
                    updateTaskElementState(taskId, updates.completed);
                } else {
                    // For other updates (like text changes), re-render
                    renderTasks();
                }
            }
        } else {
            alert('Failed to update task');
        }
    } catch (error) {
        alert('Error connecting to server');
    }
}

function updateTaskElementState(taskId, completed) {
    const listItem = document.querySelector(`li[data-task-id="${taskId}"]`);
    console.log('updateTaskElementState called:', taskId, completed, listItem);
    
    if (!listItem) {
        console.log('List item not found!');
        return;
    }
    
    const checkbox = listItem.querySelector('input[type="checkbox"]');
    const taskText = listItem.querySelector('.task-text');
    
    if (taskText) {
        if (completed) {
            console.log('Task completed - applying fade-out animation');
            // Apply strike-through and fade animation
            taskText.style.textDecoration = 'line-through';
            taskText.style.opacity = '0.6';
            listItem.classList.add('completed-task');
            
            // Fade out the task
            setTimeout(() => {
                console.log('Starting fade-out animation');
                listItem.style.transition = 'all 0.6s ease';
                listItem.style.opacity = '0';
                listItem.style.transform = 'translateX(-30px) scale(0.9)';
                
                // After animation, re-render to hide completed tasks (unless toggle is on)
                setTimeout(() => {
                    console.log('Re-rendering tasks to hide completed');
                    renderTasks();
                }, 600);
            }, 1500);
        } else {
            // Unchecked - remove completion styling
            listItem.classList.remove('completed-task');
            listItem.style.transition = '';
            listItem.style.opacity = '1';
            listItem.style.transform = '';
            taskText.style.textDecoration = 'none';
            taskText.style.opacity = '1';
        }
    }
    
    // Update task counter
    updateTaskCounter();
}

async function editTask(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    const newText = prompt('Edit task:', task.text);
    if (newText && newText.trim() !== '' && newText !== task.text) {
        await updateTask(taskId, { text: newText });
    }
}

async function deleteTask(taskId, listItem) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (response.ok) {
            allTasks = allTasks.filter(t => t.id !== taskId);
            
            // Smooth fade-out animation before removing
            const taskElement = document.querySelector(`li[data-task-id="${taskId}"]`);
            if (taskElement) {
                taskElement.style.transition = 'all 0.3s ease';
                taskElement.style.opacity = '0';
                taskElement.style.transform = 'translateX(-20px)';
                
                setTimeout(() => {
                    taskElement.remove();
                    updateTaskCounter();
                    updateCategoryFilter();
                }, 300);
            } else {
                updateTaskCounter();
                updateCategoryFilter();
            }
        } else {
            alert('Failed to delete task');
        }
    } catch (error) {
        alert('Error connecting to server');
    }
}

// Filter and search functionality
function filterTasks() {
    renderTasks();
}

// Toggle completed tasks visibility
function toggleCompletedTasks() {
    showCompleted = !showCompleted;
    const toggleBtn = document.getElementById('toggleCompleted');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (showCompleted) {
        toggleBtn.innerHTML = '<span id="toggleIcon">✕</span> Hide Completed';
        toggleBtn.classList.add('active');
    } else {
        toggleBtn.innerHTML = '<span id="toggleIcon">✓</span> Show Completed';
        toggleBtn.classList.remove('active');
    }
    
    renderTasks();
}

function renderTasks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filterCategory = document.getElementById('filterCategory').value;

    let filteredTasks = allTasks.filter(task => {
        const matchesSearch = task.text.toLowerCase().includes(searchTerm);
        const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
        const matchesCompletionState = showCompleted || !task.completed; // Hide completed unless toggle is on
        return matchesSearch && matchesCategory && matchesCompletionState;
    });

    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    filteredTasks.forEach(task => {
        const listItem = createTaskElement(task);
        taskList.appendChild(listItem);
    });

    updateTaskCounter();
    updateCategoryFilter();
}

function updateTaskCounter() {
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.completed).length;
    const counter = document.getElementById('taskCounter');
    counter.textContent = `${completed}/${total} tasks completed`;
}

function updateCategoryFilter() {
    const filterCategory = document.getElementById('filterCategory');
    const currentValue = filterCategory.value;
    
    // Get all unique categories from tasks
    const categories = new Set(['all', 'personal', 'work', 'urgent']);
    allTasks.forEach(task => {
        if (task.category && !['personal', 'work', 'urgent'].includes(task.category)) {
            categories.add(task.category);
        }
    });
    
    // Clear and rebuild filter options
    filterCategory.innerHTML = '';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        if (cat === 'all') {
            option.textContent = 'All Categories';
        } else {
            option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
        }
        filterCategory.appendChild(option);
    });
    
    // Restore previous selection if it still exists
    if ([...categories].includes(currentValue)) {
        filterCategory.value = currentValue;
    }
}

document.addEventListener('DOMContentLoaded', loadTasks);

document.addEventListener('DOMContentLoaded', function() {
    // Handle category dropdown change
    const categorySelect = document.getElementById('category');
    const customCategoryInput = document.getElementById('customCategory');
    
    categorySelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customCategoryInput.style.display = 'block';
            customCategoryInput.focus();
        } else {
            customCategoryInput.style.display = 'none';
            customCategoryInput.value = '';
        }
    });
});

async function loadTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (response.ok) {
            allTasks = await response.json();
            renderTasks();
        } else {
            alert('Failed to load tasks');
        }
    } catch (error) {
        alert('Error connecting to server. Make sure the server is running.');
    }
}

function createTaskElement(task) {
    const listItem = document.createElement('li');
    listItem.dataset.taskId = task.id;
    listItem.dataset.priority = task.priority || 'medium';
    
    // Enable drag and drop
    listItem.draggable = true;
    listItem.addEventListener('dragstart', handleDragStart);
    listItem.addEventListener('dragover', handleDragOver);
    listItem.addEventListener('dragenter', handleDragEnter);
    listItem.addEventListener('dragleave', handleDragLeave);
    listItem.addEventListener('drop', handleDrop);
    listItem.addEventListener('dragend', handleDragEnd);

    // Check if task is overdue
    if (task.date && !task.completed) {
        const taskDate = new Date(task.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (taskDate < today) {
            listItem.classList.add('overdue');
        }
    }

    const checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', function (e) {
        e.stopPropagation();
        
        const isChecked = this.checked;
        console.log('Checkbox changed:', task.id, 'completed:', isChecked);
        
        // Call async function without await to prevent blocking
        if (isChecked && task.recurrence && task.recurrence !== 'none') {
            handleRecurringTaskCompletion(task).catch(err => console.error('Error:', err));
        } else {
            updateTask(task.id, { completed: isChecked }).catch(err => console.error('Error:', err));
        }
    });

    listItem.appendChild(checkbox);

    // Task content container
    const taskContent = document.createElement('div');
    taskContent.className = 'task-content';

    const taskText = document.createElement('div');
    taskText.className = 'task-text';
    taskText.textContent = task.text;
    if (task.completed) {
        taskText.style.textDecoration = 'line-through';
        taskText.style.opacity = '0.6';
    }

    taskContent.appendChild(taskText);

    // Add notes if they exist
    if (task.notes) {
        const notesToggle = document.createElement('span');
        notesToggle.className = 'task-notes-toggle';
        notesToggle.textContent = '📝 View notes';
        notesToggle.onclick = function() {
            const notesDiv = this.nextElementSibling;
            if (notesDiv.style.display === 'none' || !notesDiv.style.display) {
                notesDiv.style.display = 'block';
                this.textContent = '📝 Hide notes';
            } else {
                notesDiv.style.display = 'none';
                this.textContent = '📝 View notes';
            }
        };
        taskContent.appendChild(notesToggle);

        const notesDiv = document.createElement('div');
        notesDiv.className = 'task-notes';
        notesDiv.textContent = task.notes;
        notesDiv.style.display = 'none';
        taskContent.appendChild(notesDiv);
    }

    const taskMeta = document.createElement('div');
    taskMeta.className = 'task-meta';

    if (task.date) {
        const dateSpan = document.createElement('span');
        dateSpan.className = 'task-date';
        dateSpan.textContent = `📅 ${task.date}`;
        taskMeta.appendChild(dateSpan);
    }

    const categorySpan = document.createElement('span');
    const category = task.category || 'personal';
    
    // Check if it's a custom category (not one of the default ones)
    const defaultCategories = ['personal', 'work', 'urgent'];
    const isCustomCategory = !defaultCategories.includes(category);
    
    categorySpan.className = isCustomCategory ? 'task-category custom' : `task-category ${category}`;
    categorySpan.textContent = category;
    taskMeta.appendChild(categorySpan);

    const prioritySpan = document.createElement('span');
    prioritySpan.className = 'task-priority';
    const priorityIcons = { high: '🔴', medium: '🟡', low: '🟢' };
    prioritySpan.textContent = `${priorityIcons[task.priority || 'medium']} ${task.priority || 'medium'}`;
    taskMeta.appendChild(prioritySpan);

    // Add recurrence badge if task is recurring
    if (task.recurrence && task.recurrence !== 'none') {
        const recurrenceSpan = document.createElement('span');
        recurrenceSpan.className = 'task-recurrence';
        const recurrenceIcons = { daily: '🔄', weekly: '📅', monthly: '📆' };
        recurrenceSpan.textContent = `${recurrenceIcons[task.recurrence]} ${task.recurrence}`;
        taskMeta.appendChild(recurrenceSpan);
    }

    taskContent.appendChild(taskText);
    taskContent.appendChild(taskMeta);
    listItem.appendChild(taskContent);

    // Task actions
    const taskActions = document.createElement('div');
    taskActions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️ Edit';
    editBtn.className = 'edit-btn';
    editBtn.onclick = () => editTask(task.id);
    taskActions.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️ Delete';
    deleteBtn.className = 'delete-btn';
    deleteBtn.onclick = () => {
        if (confirm('Delete this task?')) {
            deleteTask(task.id);
        }
    };
    taskActions.appendChild(deleteBtn);

    listItem.appendChild(taskActions);

    return listItem;
}

// Drag and Drop functionality
let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    
    // Delay to prevent immediate style application
    setTimeout(() => {
        this.style.display = 'flex';
    }, 0);
}

function handleDragEnter(e) {
    if (this !== draggedElement) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDragOver(e) {
    e.preventDefault();
    
    if (this === draggedElement) {
        return;
    }
    
    const container = document.getElementById('taskList');
    const afterElement = getDragAfterElement(container, e.clientY);
    
    if (afterElement == null) {
        container.appendChild(draggedElement);
    } else if (afterElement !== draggedElement) {
        container.insertBefore(draggedElement, afterElement);
    }
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    this.classList.remove('drag-over');
    
    // Update task order after drop
    updateTaskOrder();
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    
    // Remove any visual indicators from all elements
    const items = document.querySelectorAll('#taskList li');
    items.forEach(item => {
        item.classList.remove('drag-over');
    });
    
    draggedElement = null;
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function updateTaskOrder() {
    const taskList = document.getElementById('taskList');
    const taskElements = taskList.querySelectorAll('li');
    const newOrder = [];
    
    taskElements.forEach((element, index) => {
        const taskId = parseInt(element.dataset.taskId);
        newOrder.push(taskId);
    });
    
    // Update the order in allTasks array
    allTasks.sort((a, b) => {
        return newOrder.indexOf(a.id) - newOrder.indexOf(b.id);
    });
    
    // Save order to server
    try {
        await fetch(`${API_URL}/tasks/reorder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ order: newOrder })
        });
    } catch (error) {
        console.error('Failed to save task order');
    }
}

// Handle recurring task completion
async function handleRecurringTaskCompletion(task) {
    if (!task.date) {
        await updateTask(task.id, { completed: true });
        return;
    }

    const currentDate = new Date(task.date);
    let nextDate;

    switch (task.recurrence) {
        case 'daily':
            nextDate = new Date(currentDate);
            nextDate.setDate(nextDate.getDate() + 1);
            break;
        case 'weekly':
            nextDate = new Date(currentDate);
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case 'monthly':
            nextDate = new Date(currentDate);
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        default:
            await updateTask(task.id, { completed: true });
            return;
    }

    // Format the next date
    const formattedNextDate = nextDate.toISOString().split('T')[0];

    try {
        // Create a new task with the next occurrence date
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                text: task.text,
                date: formattedNextDate,
                completed: false,
                priority: task.priority,
                category: task.category,
                notes: task.notes,
                recurrence: task.recurrence
            })
        });

        if (response.ok) {
            const newTask = await response.json();
            allTasks.push(newTask);
            
            // Mark the current task as completed without re-rendering
            const taskIndex = allTasks.findIndex(t => t.id === task.id);
            if (taskIndex !== -1) {
                allTasks[taskIndex].completed = true;
            }
            
            // Update only the specific task element
            updateTaskElementState(task.id, true);
            
            // Add the new recurring task to the list smoothly
            const taskList = document.getElementById('taskList');
            const newListItem = createTaskElement(newTask);
            newListItem.style.opacity = '0';
            taskList.appendChild(newListItem);
            
            // Fade in animation
            setTimeout(() => {
                newListItem.style.transition = 'opacity 0.3s ease';
                newListItem.style.opacity = '1';
            }, 10);
            
            // Show notification
            setTimeout(() => {
                alert(`Task completed! Next occurrence scheduled for ${formattedNextDate}`);
            }, 350);
        } else {
            alert('Failed to create next occurrence');
        }
    } catch (error) {
        alert('Error creating recurring task');
    }
}
