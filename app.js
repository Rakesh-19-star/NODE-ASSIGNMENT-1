const express = require('express')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const format = require('date-fns/format')

app.use(express.json())

let db
const dbPath = path.join(__dirname, 'todoApllication.db')

const InitAndStartServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`)
    process.exit(1)
  }
}

InitAndStartServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const haspriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}

const hasCategorAndStatus = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

const hasCategorAndPriority = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}

const hasSearch = requestQuery => {
  return requestQuery.search_q !== undefined
}

const responseObject = dbobj => {
  return {
    id: dbobj.id,
    todo: dbobj.todo,
    priority: dbobj.priority,
    status: dbobj.status,
    category: dbobj.category,
    dueDate: dbobj.due_date,
  }
}

app.get('/todos/', async (request, response) => {
  const {search = '', priority, status, category} = request.query

  let data
  let getTodoQuery = ''

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodoQuery = `
            SELECT 
              *
            FROM 
              todo 
            WHERE
              priority='${priority}' 
              AND 
              status='${status}'
          `
          data = await db.all(getTodoQuery)
          response.send(data.map(responseObject))
        } else {
          response.status(400).send('Invalid Todo Status')
        }
      } else {
        response.status(400).send('Invalid Todo Priority')
      }
      break

    case hasCategorAndStatus(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodoQuery = `
            SELECT 
              * 
            FROM 
              todo 
            WHERE  
              category='${category}' AND status='${status}'
          `
          data = await db.all(getTodoQuery)
          response.send(data.map(responseObject))
        } else {
          response.status(400).send('Invalid Todo Status')
        }
      } else {
        response.status(400).send('Invalid Todo Category')
      }
      break

    case hasCategorAndPriority(request.query):
      if (
        category === 'HOME' ||
        category === 'WORK' ||
        category === 'LEARNING'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          getTodoQuery = `
            SELECT  
              * 
            FROM 
              todo 
            WHERE  
              category='${category}' AND priority='${priority}'
          `
          data = await db.all(getTodoQuery)
          response.send(data.map(responseObject))
        } else {
          response.status(400).send('Invalid Todo Priority')
        }
      } else {
        response.status(400).send('Invalid Todo Category')
      }
      break

    case haspriorityProperty(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodoQuery = `
          SELECT
            *
          FROM 
            todo 
          WHERE  
            priority='${priority}'
        `
        data = await db.all(getTodoQuery)
        response.send(data.map(responseObject))
      } else {
        response.status(400).send('Invalid Todo Priority')
      }
      break

    case hasCategoryProperty(request.query):
      if (
        category === 'HOME' ||
        category === 'WORK' ||
        category === 'LEARNING'
      ) {
        getTodoQuery = `
          SELECT
            *
          FROM 
            todo 
          WHERE  
            category='${category}'
        `
        data = await db.all(getTodoQuery)
        response.send(data.map(responseObject))
      } else {
        response.status(400).send('Invalid Todo Category')
      }
      break

    case hasStatusProperty(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodoQuery = `
          SELECT
            *
          FROM 
            todo 
          WHERE  
            status='${status}'
        `
        data = await db.all(getTodoQuery)
        response.send(data.map(responseObject))
      } else {
        response.status(400).send('Invalid Todo Status')
      }
      break

    case hasSearch(request.query):
      getTodoQuery = `
        SELECT * FROM todo WHERE todo like '${search_q}'
      `
      data = await db.all(getTodoQuery)
      response.send(data.map(responseObject))
      break

    default:
      getTodoQuery = `
        SELECT * FROM todo 
      `
      data = await db.all(getTodoQuery)
      response.send(data.map(responseObject))
  }
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `
    SELECT 
    *
    FROM 
    todo 
    WHERE 
    id=${todoId}
  `
  const result = await db.get(getTodoQuery)
  response.send(result)
})

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  if (isMatch(date, 'YYYY-MM-dd')) {
    const newDate = format(new Date(date), 'YYYY-MM-dd')
    const requestQuery = `
      SELECT * FROM todo WHERE 
      due_date='${newDate}'
    `
    const res = await db.all(requestQuery)
    response.send(responseObject(res))
  }
})

app.get('/agenda/?date=2021-12-12', async (request, response) => {
  const {date} = request.query
  if (isMatch(date, 'YYYY-MM-dd')) {
    const newDate = format(new Date(date), 'YYYY-MM-dd')
    const requestQuery = `
      SELECT 
      *
      FROM 
      todo 
      WHERE  
      due_date='${newDate}'
    `
    const res = await db.all(requestQuery)
    response.send(res.map(responseObject))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isMatch(dueDate, 'YYYY-MM-dd')) {
          const postNewDate = format(new Date(dueDate), 'YYYY-MM-dd')
          const postTodoQuery = `
            INSERT 
            INTO 
            todo(id,todo,priority,status,category,due_date)
            VALUES 
            (
              ${id},
             '${todo}',
              '${priority}',
              '${status}',
              '${category}',
              '${postNewDate}'
            )
          `
          await db.run(postTodoQuery)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const requestBody = request.body
  const prevoisTodoQuery = `
    SELECT 
    *
    FROM 
    todo 
    WHERE 
    id=${todoId}
  `
  const prevoisTodo = await db.get(prevoisTodoQuery)
  const {
    todo = prevoisTodo.todo,
    priority = prevoisTodo.priority,
    status = prevoisTodo.status,
    category = prevoisTodo.category,
    dueDate = prevoisTodo.dueDate,
  } = requestBody
  let updateQuery = ''
  switch (true) {
    case requestBody.status !== undefined:
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        updateQuery = `
            UPDATE 
            todo 
            SET 
            todo='${todo}',
            priority='${priority}',
            status='${status}',
            category='${category}',
            due_date='${dueDate}'
            WHERE 
            id=${todoId}
          `
        await db.run(updateQuery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case requestBody.priority !== undefined:
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        updateQuery = `
            UPDATE 
            todo 
            SET 
            todo='${todo}',
            priority='${priority}',
            status='${status}',
            category='${category}',
            due_date='${dueDate}'
            WHERE 
            id=${todoId}
          `
        await db.run(updateQuery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case requestBody.category !== undefined:
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        updateQuery = `
            UPDATE 
            todo 
            SET 
            todo='${todo}',
            priority='${priority}',
            status='${status}',
            category='${category}',
            due_date='${dueDate}'
            WHERE 
            id=${todoId}
          `
        await db.run(updateQuery)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case requestBody.todo !== undefined:
      updateQuery = `
            UPDATE 
            todo 
            SET 
            todo='${todo}',
            priority='${priority}',
            status='${status}',
            category='${category}',
            due_date='${dueDate}'
            WHERE 
            id=${todoId}
          `
      await db.run(updateQuery)
      response.send('Todo Updated')
      break
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, 'YYYY-MM-dd')) {
        const newDate = format(new Date(dueDate), 'YYYY-MM-dd')
        updateQuery = `
            UPDATE 
            todo 
            SET 
            todo='${todo}',
            priority='${priority}',
            status='${status}',
            category='${category}',
            due_date='${newDate}'
            WHERE 
            id=${todoId}
          `
        await db.run(updateQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
  }
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `
    DELETE 
    FROM 
    todo 
    WHERE  
    id=${todoId}
  `
  const res = await db.run(deleteQuery)
  response.send('Todo Deleted')
})
module.exports=app;
