import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet,
  Alert, TouchableOpacity, FlatList, ActivityIndicator
} from 'react-native';
import axios from 'axios';

export default function TaskDetailScreen({ route, navigation }) {
  const { token, task, role, userId } = route.params;

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [error, setError] = useState('');
  const [showTaskMenu, setShowTaskMenu] = useState(false);
  const [commentMenu, setCommentMenu] = useState({});
  const [loading, setLoading] = useState(true);

  // Kullanıcı yetkisi kontrolü
  const canComment = role === 'admin' || task.createdBy === userId || (task.assignedUserIds && task.assignedUserIds.includes(userId));

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://10.0.2.2:5000/api/comments/${task.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(res.data);
      setError('');
    } catch {
      setError('Failed to load comments.');
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;
    try {
      if (editingCommentId) {
        await axios.put(`http://10.0.2.2:5000/api/comments/${editingCommentId}`,
          { text: newComment },
          { headers: { Authorization: `Bearer ${token}` } });
        setEditingCommentId(null);
      } else {
        await axios.post(`http://10.0.2.2:5000/api/comments/${task.id}`,
          { text: newComment },
          { headers: { Authorization: `Bearer ${token}` } });
      }
      setNewComment('');
      fetchComments();
    } catch {
      setError('Failed to save comment.');
    }
  };

  const deleteComment = async (id) => {
    Alert.alert('Delete Comment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await axios.delete(`http://10.0.2.2:5000/api/comments/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            fetchComments();
          } catch {
            setError('Failed to delete comment.');
          }
        }
      }
    ]);
  };

  const deleteTask = () => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await axios.delete(`http://10.0.2.2:5000/api/tasks/${task.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            navigation.navigate('Tasks', { token, role, userId, refresh: true });
          } catch {
            setError('Failed to delete task.');
          }
        }
      }
    ]);
  };

  const goToEditTask = () => {
    navigation.navigate('EditTask', {
      token, role, task, userId,
      allowProgressOnly: role !== 'admin' && task.createdBy !== userId
    });
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const priorityBorderColor = (priority) => {
    switch (priority) {
      case 'low': return '#28a745';
      case 'medium': return '#ffc107';
      case 'high': return '#dc3545';
      default: return '#333';
    }
  };

  const statusBackgroundColor = (status) => {
    switch (status) {
      case 'todo': return '#f9f9f9';
      case 'in_progress': return '#fff8e1';
      case 'completed': return '#e8f5e9';
      default: return '#ffffff';
    }
  };

  // Durumu kullanıcı dostu yazıya çevir
  const friendlyStatus = (status) => {
    switch (status) {
      case 'todo': return 'To Do';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  };

  const assignedUsersDisplay = task.assignedUsernames && task.assignedUsernames.length > 0
    ? task.assignedUsernames.join(', ')
    : 'N/A';

  return (
    <View style={styles.container}>
      <View style={[
        styles.card,
        { borderColor: priorityBorderColor(task.priority) },
        { backgroundColor: statusBackgroundColor(task.status) }
      ]}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{task.title}</Text>
          <TouchableOpacity onPress={() => setShowTaskMenu(!showTaskMenu)}>
            <Text style={styles.menuIcon}>⋮</Text>
          </TouchableOpacity>
        </View>
        {showTaskMenu && (
          <View style={styles.menu}>
            <TouchableOpacity onPress={goToEditTask}>
              <Text style={styles.menuItem}>✏️ Edit Task</Text>
            </TouchableOpacity>
            {role === 'admin' && (
              <TouchableOpacity onPress={deleteTask}>
                <Text style={styles.menuItem}>🗑 Delete Task</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text><Text style={styles.label}>Description: </Text>{task.description || 'N/A'}</Text>
        <Text><Text style={styles.label}>Status: </Text>{friendlyStatus(task.status)}</Text>
        <Text><Text style={styles.label}>Progress: </Text>{task.progress}%</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${task.progress}%` }]} />
        </View>
        <Text style={[styles.priorityText, { color: priorityBorderColor(task.priority) }]}>
          <Text style={styles.label}>Priority: </Text>{task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
        </Text>
        <Text><Text style={styles.label}>Category: </Text>{task.category || 'N/A'}</Text>
        <Text><Text style={styles.label}>Start Date: </Text>{formatDate(task.startDate)}</Text>
        <Text><Text style={styles.label}>Due Date: </Text>{formatDate(task.dueDate)}</Text>
        <Text><Text style={styles.label}>Assigned To: </Text>{assignedUsersDisplay}</Text>
        <Text><Text style={styles.label}>Creator: </Text>{task.createdByUsername || 'N/A'}</Text>
      </View>

      <Text style={styles.header}>💬 Comments</Text>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={comments}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onLongPress={() => {
                // Sadece kendi yorumunu veya admin ise menu göster
                if (item.userId === userId || role === 'admin') {
                  setCommentMenu(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                }
              }}
              style={styles.commentCard}
            >
              <Text><Text style={styles.label}>👤 {item.username}: </Text>{item.text}</Text>
              {commentMenu[item.id] && (
                <View style={styles.menu}>
                  {(item.userId === userId) && (
                    <TouchableOpacity onPress={() => {
                      setNewComment(item.text);
                      setEditingCommentId(item.id);
                      setCommentMenu(prev => ({ ...prev, [item.id]: false }));
                    }}>
                      <Text style={styles.menuItem}>✏️ Edit</Text>
                    </TouchableOpacity>
                  )}
                  {(role === 'admin' || item.userId === userId) && (
                    <TouchableOpacity onPress={() => deleteComment(item.id)}>
                      <Text style={styles.menuItem}>🗑 Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text>No comments yet.</Text>}
        />
      )}

      {canComment ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Write a comment..."
            value={newComment}
            onChangeText={setNewComment}
          />
          <Button title={editingCommentId ? 'Update Comment' : 'Submit'} onPress={submitComment} />
        </>
      ) : (
        <Text style={{ textAlign: 'center', color: 'gray', marginVertical: 10 }}>
          You are not authorized to comment on this task.
        </Text>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flex: 1 },
  card: { padding: 15, marginBottom: 10, borderRadius: 10, borderWidth: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  label: { fontWeight: 'bold' },
  priorityText: { fontWeight: 'bold', marginVertical: 4 },
  menuIcon: { fontSize: 24, padding: 4, color: '#555' },
  menu: { backgroundColor: '#f1f1f1', padding: 8, borderRadius: 6, marginVertical: 5 },
  menuItem: { paddingVertical: 4, fontSize: 16 },
  progressBar: { height: 8, backgroundColor: '#ddd', borderRadius: 4, overflow: 'hidden', marginVertical: 6 },
  progressFill: { height: '100%', backgroundColor: '#4caf50' },
  error: { color: 'red', marginTop: 10 },
  header: { fontSize: 20, fontWeight: 'bold', marginVertical: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginVertical: 10 },
  commentCard: { backgroundColor: '#eef2f5', padding: 10, borderRadius: 8, marginVertical: 4 }
});
