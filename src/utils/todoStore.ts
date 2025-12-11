import { ref, computed } from 'vue'
import { selectSQL, execSQL } from './db'
import { initializeTodoTable } from './initDb'

export interface TodoItem {
  id: number
  content: string
  completed: boolean
  due_date: string | null
  expected_completion_time: string | null
  reminder_time: string | null
  parent_id: number | null
  group_id: number | null
  children?: TodoItem[]
  expanded?: boolean // 用于控制子项的展开/收起状态
}

export interface TodoGroup {
  id: number
  name: string
  color: string
  sort_order: number
  created_at: string
}

// 全局状态管理
const todos = ref<TodoItem[]>([])
const groups = ref<TodoGroup[]>([])
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
      await loadAllGroups()
      await loadAllTodos()
      isInitialized.value = true
    } catch (error) {
      console.error('初始化待办事项失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 加载所有分组
  const loadAllGroups = async () => {
    try {
      const result = await selectSQL<TodoGroup>(
        'SELECT id, name, color, sort_order, created_at FROM groups ORDER BY sort_order ASC, id ASC'
      )
      groups.value = result
      console.log('加载分组成功:', groups.value)
    } catch (error) {
      console.error('加载分组失败:', error)
      throw error
    }
  }

  // 加载所有待办事项
  const loadAllTodos = async () => {
    try {
      isLoading.value = true
      const result = await selectSQL<TodoItem>(
        'SELECT id, content, completed, due_date, expected_completion_time, reminder_time, parent_id, group_id FROM todos ORDER BY id DESC'
      )
      const rawTodos = result.map(todo => ({
        ...todo,
        completed: Boolean(todo.completed),
        due_date: todo.due_date || null,
        expected_completion_time: todo.expected_completion_time || null,
        reminder_time: todo.reminder_time || null,
        parent_id: todo.parent_id || null,
        group_id: todo.group_id || null,
        expanded: false
      }))
      
      // 构建层次结构
      todos.value = buildTodoHierarchy(rawTodos)
      console.log('加载待办事项成功:', todos.value)
    } catch (error) {
      console.error('加载待办事项失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 构建待办事项层次结构
  const buildTodoHierarchy = (flatTodos: TodoItem[]): TodoItem[] => {
    const todoMap = new Map<number, TodoItem>()
    const rootTodos: TodoItem[] = []

    // 创建所有待办事项的映射
    flatTodos.forEach(todo => {
      todoMap.set(todo.id, { ...todo, children: [] })
    })

    // 构建层次结构
    flatTodos.forEach(todo => {
      const todoItem = todoMap.get(todo.id)!
      if (todo.parent_id === null) {
        rootTodos.push(todoItem)
      } else {
        const parent = todoMap.get(todo.parent_id)
        if (parent) {
          parent.children!.push(todoItem)
        }
      }
    })

    return rootTodos
  }

  // 递归查找待办事项
  const findTodoById = (todoList: TodoItem[], id: number): TodoItem | null => {
    for (const todo of todoList) {
      if (todo.id === id) {
        return todo
      }
      if (todo.children && todo.children.length > 0) {
        const found = findTodoById(todo.children, id)
        if (found) return found
      }
    }
    return null
  }

  // 递归获取所有待办事项（平铺）
  const getAllTodosFlat = (todoList: TodoItem[]): TodoItem[] => {
    const result: TodoItem[] = []
    for (const todo of todoList) {
      result.push(todo)
      if (todo.children && todo.children.length > 0) {
        result.push(...getAllTodosFlat(todo.children))
      }
    }
    return result
  }

  // 切换展开/收起状态
  const toggleTodoExpanded = (id: number) => {
    const todo = findTodoById(todos.value, id)
    if (todo) {
      todo.expanded = !todo.expanded
    }
  }

  // 添加待办事项
  const addTodo = async (
    content: string, 
    dueDate?: string | null, 
    parentId?: number | null,
    expectedCompletionTime?: string | null,
    reminderTime?: string | null,
    groupId?: number | null
  ) => {
    if (!content.trim()) return null
    
    try {
      const result = await execSQL(
        'INSERT INTO todos (content, completed, due_date, expected_completion_time, reminder_time, parent_id, group_id) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
        [content, false, dueDate || null, expectedCompletionTime || null, reminderTime || null, parentId || null, groupId || null]
      )
      
      const newTodo: TodoItem = {
        id: result.lastInsertId,
        content,
        completed: false,
        due_date: dueDate || null,
        expected_completion_time: expectedCompletionTime || null,
        reminder_time: reminderTime || null,
        parent_id: parentId || null,
        group_id: groupId || null,
        children: [],
        expanded: false
      }
      
      if (parentId) {
        // 如果是子项，添加到父项的children中
        const parentTodo = findTodoById(todos.value, parentId)
        if (parentTodo) {
          if (!parentTodo.children) {
            parentTodo.children = []
          }
          parentTodo.children.unshift(newTodo)
          parentTodo.expanded = true // 自动展开父项以显示新添加的子项
        }
      } else {
        // 如果是根级待办事项，添加到根数组
        todos.value.unshift(newTodo)
      }
      
      return newTodo
    } catch (error) {
      console.error('添加待办事项失败:', error)
      throw error
    }
  }

  // 更新待办事项状态
  const updateTodoStatus = async (id: number, completed: boolean) => {
    const todo = findTodoById(todos.value, id)
    if (!todo) return false
    
    const originalStatus = todo.completed
    try {
      // 乐观更新
      todo.completed = completed
      
      await execSQL(
        'UPDATE todos SET completed = ? WHERE id = ?',
        [completed, id]
      )

      // 如果完成了父项，询问是否同时完成所有子项
      if (completed && todo.children && todo.children.length > 0) {
        const hasIncompleteChildren = todo.children.some(child => !child.completed)
        if (hasIncompleteChildren) {
          // 这里可以添加用户确认逻辑
          // 暂时自动完成所有子项
          await updateChildrenStatus(todo.children, completed)
        }
      }

      return true
    } catch (error) {
      // 如果更新失败，恢复原来的状态
      todo.completed = originalStatus
      console.error('更新待办事项状态失败:', error)
      throw error
    }
  }

  // 递归更新子项状态
  const updateChildrenStatus = async (children: TodoItem[], completed: boolean) => {
    for (const child of children) {
      child.completed = completed
      await execSQL(
        'UPDATE todos SET completed = ? WHERE id = ?',
        [completed, child.id]
      )
      if (child.children && child.children.length > 0) {
        await updateChildrenStatus(child.children, completed)
      }
    }
  }

  // 更新待办事项内容
  const updateTodoContent = async (id: number, content: string) => {
    if (!content.trim()) {
      return await deleteTodo(id)
    }
    
    const todo = findTodoById(todos.value, id)
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
    const todo = findTodoById(todos.value, id)
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

  // 更新待办事项期望完成时间
  const updateTodoExpectedCompletionTime = async (id: number, expectedCompletionTime: string | null) => {
    const todo = findTodoById(todos.value, id)
    if (!todo) return false
    
    const originalTime = todo.expected_completion_time
    try {
      todo.expected_completion_time = expectedCompletionTime || null
      
      await execSQL(
        'UPDATE todos SET expected_completion_time = ? WHERE id = ?',
        [expectedCompletionTime || null, id]
      )
      return true
    } catch (error) {
      todo.expected_completion_time = originalTime
      console.error('更新待办事项期望完成时间失败:', error)
      throw error
    }
  }

  // 更新待办事项提醒时间
  const updateTodoReminderTime = async (id: number, reminderTime: string | null) => {
    const todo = findTodoById(todos.value, id)
    if (!todo) return false
    
    const originalTime = todo.reminder_time
    try {
      todo.reminder_time = reminderTime || null
      
      await execSQL(
        'UPDATE todos SET reminder_time = ? WHERE id = ?',
        [reminderTime || null, id]
      )
      return true
    } catch (error) {
      todo.reminder_time = originalTime
      console.error('更新待办事项提醒时间失败:', error)
      throw error
    }
  }

  // 删除待办事项
  const deleteTodo = async (id: number) => {
    try {
      await execSQL('DELETE FROM todos WHERE id = ? OR parent_id = ?', [id, id])
      
      // 从内存中删除
      const removeTodoFromList = (todoList: TodoItem[], targetId: number): TodoItem[] => {
        return todoList.filter(todo => {
          if (todo.id === targetId) {
            return false
          }
          if (todo.children && todo.children.length > 0) {
            todo.children = removeTodoFromList(todo.children, targetId)
          }
          return true
        })
      }
      
      todos.value = removeTodoFromList(todos.value, id)
      return true
    } catch (error) {
      console.error('删除待办事项失败:', error)
      throw error
    }
  }

  // 获取指定日期的待办事项
  const getTodosForDate = (date: Date): TodoItem[] => {
    const dateStr = date.toISOString().split('T')[0] // 格式为 YYYY-MM-DD
    const allTodos = getAllTodosFlat(todos.value)
    return allTodos.filter(todo => todo.due_date === dateStr)
  }

  // 获取所有待办事项
  const getAllTodos = computed(() => todos.value)

  // 获取有日期的待办事项
  const getTodosWithDates = computed(() => {
    const allTodos = getAllTodosFlat(todos.value)
    return allTodos.filter(todo => todo.due_date !== null)
  })

  // 获取没有日期的待办事项
  const getTodosWithoutDates = computed(() => {
    const allTodos = getAllTodosFlat(todos.value)
    return allTodos.filter(todo => todo.due_date === null)
  })

  // 添加分组
  const addGroup = async (name: string, color: string = '#42b983') => {
    if (!name.trim()) return null
    
    try {
      // 获取当前最大的sort_order值
      const maxOrder = groups.value.length > 0 
        ? Math.max(...groups.value.map(g => g.sort_order || 0))
        : -1
      
      const result = await execSQL(
        'INSERT INTO groups (name, color, sort_order) VALUES (?, ?, ?) RETURNING id',
        [name.trim(), color, maxOrder + 1]
      )
      
      const newGroup: TodoGroup = {
        id: result.lastInsertId,
        name: name.trim(),
        color,
        sort_order: maxOrder + 1,
        created_at: new Date().toISOString()
      }
      
      groups.value.push(newGroup)
      return newGroup
    } catch (error) {
      console.error('添加分组失败:', error)
      throw error
    }
  }

  // 更新分组
  const updateGroup = async (id: number, name: string, color: string) => {
    if (!name.trim()) return false
    
    const group = groups.value.find(g => g.id === id)
    if (!group) return false
    
    const originalName = group.name
    const originalColor = group.color
    
    try {
      group.name = name.trim()
      group.color = color
      
      await execSQL(
        'UPDATE groups SET name = ?, color = ? WHERE id = ?',
        [name.trim(), color, id]
      )
      return true
    } catch (error) {
      group.name = originalName
      group.color = originalColor
      console.error('更新分组失败:', error)
      throw error
    }
  }

  // 删除分组
  const deleteGroup = async (id: number) => {
    try {
      await execSQL('DELETE FROM groups WHERE id = ?', [id])
      groups.value = groups.value.filter(g => g.id !== id)
      return true
    } catch (error) {
      console.error('删除分组失败:', error)
      throw error
    }
  }

  // 更新分组排序
  const updateGroupOrder = async (reorderedGroups: TodoGroup[]) => {
    try {
      // 更新内存中的顺序
      groups.value = reorderedGroups
      
      // 批量更新数据库中的sort_order
      for (let i = 0; i < reorderedGroups.length; i++) {
        const group = reorderedGroups[i]
        group.sort_order = i
        await execSQL(
          'UPDATE groups SET sort_order = ? WHERE id = ?',
          [i, group.id]
        )
      }
      return true
    } catch (error) {
      console.error('更新分组排序失败:', error)
      throw error
    }
  }

  // 更新待办事项的分组
  const updateTodoGroup = async (id: number, groupId: number | null) => {
    const todo = findTodoById(todos.value, id)
    if (!todo) return false
    
    const originalGroupId = todo.group_id
    
    try {
      todo.group_id = groupId
      
      await execSQL(
        'UPDATE todos SET group_id = ? WHERE id = ?',
        [groupId, id]
      )
      return true
    } catch (error) {
      todo.group_id = originalGroupId
      console.error('更新待办事项分组失败:', error)
      throw error
    }
  }

  return {
    // 状态
    todos: getAllTodos,
    todosWithDates: getTodosWithDates,
    todosWithoutDates: getTodosWithoutDates,
    groups: computed(() => groups.value),
    isLoading: computed(() => isLoading.value),
    isInitialized: computed(() => isInitialized.value),

    // 方法
    initializeTodos,
    loadAllTodos,
    loadAllGroups,
    addTodo,
    updateTodoStatus,
    updateTodoContent,
    updateTodoDate,
    updateTodoExpectedCompletionTime,
    updateTodoReminderTime,
    updateTodoGroup,
    deleteTodo,
    getTodosForDate,
    toggleTodoExpanded,
    findTodoById,
    // 分组方法
    addGroup,
    updateGroup,
    deleteGroup,
    updateGroupOrder
  }
}

// 导出一个单例实例，确保整个应用使用同一个状态
export const todoStore = useTodos()
