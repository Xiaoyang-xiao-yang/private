import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');

  // 获取所有待办
  const fetchTodos = () => {
    axios.get(`${API}/api/todos`).then(res => setTodos(res.data));
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  // 添加
  const handleAdd = () => {
    const title = input.trim();
    if (!title) return;
    axios.post(`${API}/api/todos`, { title }).then(() => {
      setInput('');
      fetchTodos();
    });
  };

  // 回车提交
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
  };

  // 切换完成状态
  const handleToggle = (todo) => {
    axios
      .put(`${API}/api/todos/${todo.id}`, { completed: !todo.completed })
      .then(fetchTodos);
  };

  // 进入编辑
  const startEdit = (todo) => {
    setEditId(todo.id);
    setEditText(todo.title);
  };

  // 保存编辑
  const saveEdit = (id) => {
    const title = editText.trim();
    if (!title) return;
    axios.put(`${API}/api/todos/${id}`, { title }).then(() => {
      setEditId(null);
      setEditText('');
      fetchTodos();
    });
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditId(null);
    setEditText('');
  };

  // 删除
  const handleDelete = (id) => {
    axios.delete(`${API}/api/todos/${id}`).then(fetchTodos);
  };

  return (
    <div className="container">
      <h1>TodoList</h1>

      <div className="add-row">
        <input
          type="text"
          placeholder="输入待办事项，回车或点击添加"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={handleAdd}>添加</button>
      </div>

      <ul className="todo-list">
        {todos.length === 0 && <li className="empty">暂无待办事项</li>}
        {todos.map(todo => (
          <li key={todo.id} className={todo.completed ? 'done' : ''}>
            {editId === todo.id ? (
              <div className="edit-row">
                <input
                  type="text"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveEdit(todo.id);
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  autoFocus
                />
                <button onClick={() => saveEdit(todo.id)}>保存</button>
                <button onClick={cancelEdit}>取消</button>
              </div>
            ) : (
              <div className="item-row">
                <input
                  type="checkbox"
                  checked={!!todo.completed}
                  onChange={() => handleToggle(todo)}
                />
                <span className="title">{todo.title}</span>
                <button onClick={() => startEdit(todo)}>编辑</button>
                <button className="del" onClick={() => handleDelete(todo.id)}>删除</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
