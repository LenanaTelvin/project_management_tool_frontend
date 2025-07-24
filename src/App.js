import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE;

function App() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [file, setFile] = useState(null);
  const [projectFiles, setProjectFiles] = useState({});
  const [tasks, setTasks] = useState({});
  const [newTask, setNewTask] = useState('');
  const [completion, setCompletion] = useState({});
  const [viewedFileContent, setViewedFileContent] = useState(null);
  const [viewedFileType, setViewedFileType] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/projects`).then(res => {
      setProjects(res.data);
      res.data.forEach(p => fetchCompletion(p.id));
    });
  }, []);

  const addProject = () => {
    axios.post(`${API_BASE}/projects`, { name, description }).then(res => {
      setProjects([...projects, res.data]);
      setName('');
      setDescription('');
    });
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const uploadFile = (projectId) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    axios.post(`${API_BASE}/projects/${projectId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(() => {
      fetchFiles(projectId);
      setFile(null);
    });
  };

  const fetchFiles = (projectId) => {
    axios.get(`${API_BASE}/projects/${projectId}/files`).then(res => {
      setProjectFiles(prev => ({ ...prev, [projectId]: res.data }));
      setSelectedProjectId(projectId);
    });
  };

  const fetchTasks = (projectId) => {
    axios.get(`${API_BASE}/projects/${projectId}/tasks`).then(res => {
      setTasks(prev => ({ ...prev, [projectId]: res.data }));
    });
  };

  const addTask = (projectId) => {
    if (!newTask.trim()) return;
    axios.post(`${API_BASE}/projects/${projectId}/tasks`, { title: newTask }).then(() => {
      fetchTasks(projectId);
      setNewTask('');
      fetchCompletion(projectId);
    });
  };

  const toggleTaskDone = (taskId, done, projectId) => {
    axios.put(`${API_BASE}/tasks/${taskId}`, { done: !done }).then(() => {
      fetchTasks(projectId);
      fetchCompletion(projectId);
    });
  };

  const fetchCompletion = (projectId) => {
    axios.get(`${API_BASE}/projects/${projectId}/completion`).then(res => {
      setCompletion(prev => ({ ...prev, [projectId]: res.data.percentage }));
    });
  };

  const handleViewTasks = (projectId) => {
    fetchTasks(projectId);
    fetchCompletion(projectId);
    setSelectedProjectId(projectId);
  };

  const deleteProject = (projectId) => {
    axios.delete(`${API_BASE}/projects/${projectId}`).then(() => {
      setProjects(projects.filter(p => p.id !== projectId));
      setProjectFiles(prev => {
        const updated = { ...prev };
        delete updated[projectId];
        return updated;
      });
      setTasks(prev => {
        const updated = { ...prev };
        delete updated[projectId];
        return updated;
      });
      setCompletion(prev => {
        const updated = { ...prev };
        delete updated[projectId];
        return updated;
      });
      if (selectedProjectId === projectId) setSelectedProjectId(null);
    });
  };

  const handleViewFile = (file) => {
    const ext = file.filename.split('.').pop().toLowerCase();
    const browserViewable = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'pdf', 'txt'];

    if (browserViewable.includes(ext)) {
      window.open(`${API_BASE}/files/${file.id}/view`, '_blank');
    } else {
      axios.get(`${API_BASE}/files/${file.id}/view`, { responseType: 'text' }).then(res => {
        setViewedFileContent(res.data);
        setViewedFileType(ext);
      });
    }
  };
return (
    <div style={{
      padding: '2rem',
      maxWidth: '700px',
      margin: '2rem auto',
      background: '#f9f9f9',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>Project Management</h1>
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Project Name"
          style={{
            flex: 1,
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
        <input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description"
          style={{
            flex: 2,
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
        <button
          onClick={addProject}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            border: 'none',
            background: '#007bff',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          Add Project
        </button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {projects.map((project) => (
          <li
            key={project.id}
            style={{
              background: '#fff',
              marginBottom: '0.75rem',
              padding: '0.75rem',
              borderRadius: '4px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
            }}
          >
            <strong style={{ color: '#007bff' }}>{project.name}</strong> - {project.description}
            <span style={{ marginLeft: '1rem', color: '#28a745' }}>
              Completion: {completion[project.id] ?? 0}%
            </span>
            <div style={{ marginTop: '0.5rem' }}>
              <input type="file" onChange={handleFileChange} />
              <button onClick={() => uploadFile(project.id)} style={buttonStyle('#28a745')}>Upload File</button>
              <button onClick={() => fetchFiles(project.id)} style={buttonStyle('#17a2b8')}>View Files</button>
              <button onClick={() => handleViewTasks(project.id)} style={buttonStyle('#ffc107', '#333')}>View Tasks</button>
              <button onClick={() => deleteProject(project.id)} style={buttonStyle('#dc3545')}>Delete Project</button>
            </div>
            {selectedProjectId === project.id && (
              <div style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                <input
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  placeholder="New Task"
                  style={{
                    padding: '0.25rem',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    marginRight: '0.5rem'
                  }}
                />
                <button onClick={() => addTask(project.id)} style={buttonStyle('#007bff')}>Add Task</button>
                <ul style={{ marginTop: '0.5rem' }}>
                  {(tasks[project.id] || []).map(task => (
                    <li key={task.id} style={{ marginBottom: '0.25rem' }}>
                      {task.title}
                      <input
                        type="checkbox"
                        checked={!!task.done}
                        onChange={() => toggleTaskDone(task.id, task.done, project.id)}
                        style={{ marginLeft: '0.5rem' }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div style={{ marginTop: '0.5rem' }}>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                {(projectFiles[project.id] || []).map(file => (
                  <li key={file.id}>
                    {file.filename}
                    <button onClick={() => handleViewFile(file)} style={buttonStyle('#007bff')}>View</button>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
      {viewedFileContent && (
        <div style={{
          background: '#fff',
          borderRadius: '4px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          padding: '1rem',
          margin: '1rem 0'
        }}>
          <h3>File Content</h3>
          {viewedFileType === 'json' ? (
            <pre>{JSON.stringify(JSON.parse(viewedFileContent), null, 2)}</pre>
          ) : (
            <pre>{viewedFileContent}</pre>
          )}
          <button onClick={() => setViewedFileContent(null)} style={{ marginTop: '1rem' }}>Close</button>
        </div>
      )}
    </div>
  );
}

const buttonStyle = (bg, color = '#fff') => ({
  marginLeft: '0.5rem',
  padding: '0.25rem 0.75rem',
  borderRadius: '4px',
  border: 'none',
  background: bg,
  color: color,
  cursor: 'pointer'
});

export default App;
