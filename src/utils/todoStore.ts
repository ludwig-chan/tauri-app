import { ref, computed } from 'vue'
import { selectSQL, execSQL } from './db'
import { initializeTodoTable } from './initDb'

export interface TodoItem {
  id: number
  content: string
  completed: boolean
  due_date: string | null
}

// 全局状态管理
const todos = ref<TodoItem[]>([])
const isLoading = ref(false)
const isInitialized = ref(false)

// 初始化数据库和加载待办事项
export const useTodos = () => {
  // 初始化数据库表
  const initializeTodos = async () => {
    if (isInitialized.value) return
    
    try {
      isLoading.value = true
      await initializeTodoTable()
      await loadAllTodos()
      isInitialized.value = true
    } catch (error) {
      console.error('初始化待办事项失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 加载所有待办事项
  const loadAllTodos = async () => {
    try {
      isLoading.value = true
      const result = await selectSQL<TodoItem>(
        'SELECT id, content, completed, due_date FROM todos ORDER BY id DESC'
      )
      todos.value = result.map(todo => ({
        ...todo,
        completed: Boolean(todo.completed),
        due_date: todo.due_date || null
      }))
      console.log('加载待办事项成功:', todos.value)
    } catch (error) {
      console.error('加载待办事项失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 添加待办事项
  const addTodo = async (content: string, dueDate?: string | null) => {
    if (!content.trim()) return null
    
    try {
      const result = await execSQL(
        'INSERT INTO todos (content, completed, due_date) VALUES (?, ?, ?) RETURNING id',
        [content, false, dueDate || null]
      )
      
      const newTodo: TodoItem = {
        id: result.lastInsertId,
        content,
        completed: false,
        due_date: dueDate || null
      }
      
      todos.value.unshift(newTodo)
      return newTodo
    } catch (error) {
      console.error('添加待办事项失败:', error)
      throw error
    }
  }

  // 更新待办事项状态
  const updateTodoStatus = async (id: number, completed: boolean) => {
    const todo = todos.value.find(t => t.id === id)
    if (!todo) return false
    
    const originalStatus = todo.completed
    try {
      // 乐观更新
      todo.completed = completed
      
      await execSQL(
        'UPDATE todos SET completed = ? WHERE id = ?',
        [completed, id]
      )
      return true
    } catch (error) {
      // 如果更新失败，恢复原来的状态
      todo.completed = originalStatus
      console.error('更新待办事项状态失败:', error)
      throw error
    }
  }

  // 更新待办事项内容
  const updateTodoContent = async (id: number, content: string) => {
    if (!content.trim()) {
      return await deleteTodo(id)
    }
    
    const todo = todos.value.find(t => t.id === id)
    if (!todo) return false
    
    const originalContent = todo.content
    try {
      // 乐观更新
      todo.content = content
      
      await execSQL(
        'UPDATE todos SET content = ? WHERE id = ?',
        [content, id]
      )
      return true
    } catch (error) {
      // 如果更新失败，恢复原来的内容
      todo.content = originalContent
      console.error('更新待办事项内容失败:', error)
      throw error
    }
  }

  // 更新待办事项日期
  const updateTodoDate = async (id: number, dueDate: string | null) => {
    const todo = todos.value.find(t => t.id === id)
    if (!todo) return false
    
    const originalDate = todo.due_date
    try {
      // 乐观更新
      todo.due_date = dueDate || null
      
      await execSQL(
        'UPDATE todos SET due_date = ? WHERE id = ?',
        [dueDate || null, id]
      )
      return true
    } catch (error) {
      // 如果更新失败，恢复原来的日期
      todo.due_date = originalDate
      console.error('更新待办事项日期失败:', error)
      throw error
    }
  }

  // 删除待办事项
  const deleteTodo = async (id: number) => {
    try {
      await execSQL('DELETE FROM todos WHERE id = ?', [id])
      todos.value = todos.value.filter(t => t.id !== id)
      return true
    } catch (error) {
      console.error('删除待办事项失败:', error)
      throw error
    }
  }

  // 获取指定日期的待办事项
  const getTodosForDate = (date: Date): TodoItem[] => {
    const dateStr = date.toISOString().split('T')[0] // 格式为 YYYY-MM-DD
    return todos.value.filter(todo => todo.due_date === dateStr)
  }

  // 获取所有待办事项
  const getAllTodos = computed(() => todos.value)

  // 获取有日期的待办事项
  const getTodosWithDates = computed(() => 
    todos.value.filter(todo => todo.due_date !== null)
  )

  // 获取没有日期的待办事项
  const getTodosWithoutDates = computed(() => 
    todos.value.filter(todo => todo.due_date === null)
  )

  return {
    // 状态
    todos: getAllTodos,
    todosWithDates: getTodosWithDates,
    todosWithoutDates: getTodosWithoutDates,
    isLoading: computed(() => isLoading.value),
    isInitialized: computed(() => isInitialized.value),

    // 方法
    initializeTodos,
    loadAllTodos,
    addTodo,
    updateTodoStatus,
    updateTodoContent,
    updateTodoDate,
    deleteTodo,
    getTodosForDate
  }
}

// 导出一个单例实例，确保整个应用使用同一个状态
export const todoStore = useTodos()
