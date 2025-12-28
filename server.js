const express = require('express');
const app = express();
const port = 3000;
app.use(express.json());
const fs = require('fs');
const path = require('path');

const usersFilePath = path.join(__dirname, 'users.json');

function writeUsersToFile(users) {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}
function readUsersFromFile() {
    if (!fs.existsSync(usersFilePath)) {
        return [];
    }
    const data = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(data);
}

app.post('/users', (req, res) => {
    const { name, email, age } = req.body;
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }
    const users = readUsersFromFile();
    const emailExists = users.some(user => user.email === email);
    if (emailExists) {
        return res.status(409).json({ error: 'Email already exists' });
    }
    const newUser = {
        id: Date.now(),
        name,
        email,
        age
    };

    users.push(newUser);
    writeUsersToFile(users);

    res.status(201).json({
        message: 'User added successfully',
        user: newUser
    });
});

app.patch('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const { name, email, age } = req.body;
    const users = readUsersFromFile();
    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }
    if (email) {
        const emailExists = users.some((user, index) => user.email === email && index !== userIndex);
        if (emailExists) {
            return res.status(409).json({ error: 'Email already exists' });
        }
        users[userIndex].email = email;
    }
    if (name) users[userIndex].name = name;
    if (age) users[userIndex].age = age;

    writeUsersToFile(users);
    res.json({
        message: 'User updated successfully',
        user: users[userIndex]
    });
});
app.delete('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required.' });
    }

    const users = readUsersFromFile();

    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading users file.' });
        }

        let users = [];
        try {
            users = JSON.parse(data);
        } catch (parseErr) {
            return res.status(500).json({ message: 'Error parsing users file.' });
        }
    });
    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }
    users.splice(userIndex, 1);
    writeUsersToFile(users);
    res.json({ message: 'User deleted successfully' });

});
app.get('/users/getByName', (req, res) => {
    const { name } = req.query;
    if (!name) {
        return res.status(400).json({ error: 'Name query parameter is required' });
    }
    const users = readUsersFromFile();
    const filteredUsers = users.filter(user => user.name.toLowerCase() === name.toLowerCase());
    res.json({ users: filteredUsers });
});
app.get('/users', (req, res) => {
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading users file.' });
        }
        let users = [];
        try {
            users = JSON.parse(data);
        } catch (parseErr) {
            return res.status(500).json({ message: 'Error parsing users file.' });
        }
        res.json({ users });
    });
});
app.get('/users/filter', (req, res) => {
    const minAge = parseInt(req.query.minAge);

    if (isNaN(minAge)) {
        return res.status(400).json({ message: 'minAge query parameter is required and must be a number.' });
    }
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading users file.' });
        }
        let users;
        try {
            users = JSON.parse(data);
        } catch (parseErr) {
            return res.status(500).json({ message: 'Error parsing users file.' });
        }
        const filteredUsers = users.filter(user => user.age >= minAge);

        if (filteredUsers.length === 0) {
            return res.status(404).json({ message: 'No users found with the specified minimum age.' });
        }
        res.json({ users: filteredUsers });
    });
});
app.get('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
        return res.status(400).json({ message: 'User ID must be a number.' });
    }
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading users file.' });
        }

        let users;
        try {
            users = JSON.parse(data);
        } catch {
            return res.status(500).json({ message: 'Error parsing users file.' });
        }
        const user = users.find(user => user.id === userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json({ user });
    });
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
