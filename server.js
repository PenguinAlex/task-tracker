const express = require('express');
const bcrypt = require('bcryptjs');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Task Tracker API',
            version: '1.0.0',
            description: 'A simple task tracker API with registration, login, and task management functionalities.'
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local Development Server'
            }
        ],
    },
    apis: ['./server.js'], // path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

let users = [];
let tasks = [];
let taskId = 1;

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - username
 *         - task
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the task.
 *         username:
 *           type: string
 *           description: The username of the user who owns the task.
 *         task:
 *           type: string
 *           description: The task description.
 *         status:
 *           type: string
 *           description: The status of the task (backlog, inProgress, done, onAccess).
 *       example:
 *         id: 1
 *         username: "johndoe"
 *         task: "Finish the report"
 *         status: "backlog"
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: The username of the user.
 *         password:
 *           type: string
 *           description: The hashed password of the user.
 *       example:
 *         username: "johndoe"
 *         password: "$2a$08$Aba.jae8aw1..."
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: The users managing API
 */

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: The tasks managing API
 */

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Username is already taken
 */
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 8);

    if (users.find(user => user.username === username)) {
        return res.status(400).send('User already exists');
    }

    const newUser = { username, password: hashedPassword };
    users.push(newUser);
    res.status(201).send('User registered');
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Logs in a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Logged in successfully
 *       400:
 *         description: Invalid credentials
 */
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).send('Invalid credentials');
    }

    res.send('Logged in successfully');
});

/**
 * @swagger
 * /task:
 *   post:
 *     summary: Adds a new task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - task
 *             properties:
 *               username:
 *                 type: string
 *               task:
 *                 type: string
 *     responses:
 *       201:
 *         description: Task added
 *       400:
 *         description: User not found
 */
app.post('/task', (req, res) => {
    const { username, task } = req.body;

    if (!users.find(user => user.username === username)) {
        return res.status(400).send('User not found');
    }

    const newTask = { id: taskId++, username, task, status: 'backlog' };
    tasks.push(newTask);
    res.status(201).send('Task added');
});

/**
 * @swagger
 * /task/{id}:
 *   patch:
 *     summary: Updates the status of an existing task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The id of the task to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [backlog, inProgress, done, onAccess]
 *                 description: The new status of the task
 *     responses:
 *       200:
 *         description: Task status updated
 *       404:
 *         description: Task not found
 */
app.patch('/task/:id', (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    const task = tasks.find(task => task.id === parseInt(id));

    if (!task) {
        return res.status(404).send('Task not found');
    }

    if (!['backlog', 'inProgress', 'done', 'onAccess'].includes(status)) {
        return res.status(400).send('Invalid status');
    }

    task.status = status;
    res.send('Task updated');
});

/**
 * @swagger
 * /task/{id}:
 *   delete:
 *     summary: Deletes a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The id of the task to delete
 *     responses:
 *       200:
 *         description: Task deleted
 *       404:
 *         description: Task not found or already deleted
 */
app.delete('/task/:id', (req, res) => {
    const { id } = req.params;
    const initialLength = tasks.length;
    tasks = tasks.filter(task => task.id !== parseInt(id));

    if (tasks.length === initialLength) {
        return res.status(404).send('Task not found or already deleted');
    }

    res.send('Task deleted');
});

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Returns all tasks for a specific user
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         required: true
 *         description: Username to filter tasks by
 *     responses:
 *       200:
 *         description: An array of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       400:
 *         description: User not found
 */
app.get('/tasks', (req, res) => {
    const { username } = req.query;

    if (!users.find(user => user.username === username)) {
        return res.status(400).send('User not found');
    }

    const userTasks = tasks.filter(task => task.username === username);
    res.json(userTasks);
});

// Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
