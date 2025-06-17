import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

export default function TaskListScreen({ route, navigation }) {
  const { token, role, userId } = route.params;
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://10.0.2.2:5000/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
      const uniqueCategories = [...new Set(res.data.map(t => t.category).filter(Boolean))];
      setCategories(uniqueCategories);
      setError('');
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.response?.data?.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // Always fetch tasks when screen is focused
      fetchTasks();
    }, [])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.logoutButton}>Logout</Text>
        </TouchableOpacity>
      )
    });
  }, [navigation]);

  const friendlyStatus = (status) => {
    switch (status) {
      case 'todo': return 'To Do';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

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

  const filteredTasks = tasks.filter(task => {
    const statusMatch = statusFilter ? task.status === statusFilter : true;
    const priorityMatch = priorityFilter ? task.priority === priorityFilter : true;
    const categoryMatch = categoryFilter ? task.category === categoryFilter : true;
    const assignedMatch = role === 'admin'
      ? true
      : (task.createdBy === userId || task.assignedUserIds.includes(Number(userId)));
    return statusMatch && priorityMatch && categoryMatch && assignedMatch;
  });

  const renderItem = ({ item }) => {
    const assignedDisplay = item.assignedUsernames.length
      ? item.assignedUsernames.join(', ')
      : 'N/A';

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { borderColor: priorityBorderColor(item.priority) },
          { backgroundColor: statusBackgroundColor(item.status) },
        ]}
        onPress={() =>
          navigation.navigate('TaskDetail', { token, role, userId, task: item, refresh: true })
        }
      >
        <Text style={styles.title}>{item.title}</Text>
        <Text><Text style={styles.label}>Status: </Text>{friendlyStatus(item.status)}</Text>
        <Text><Text style={styles.label}>Progress: </Text>{item.progress}%</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
        </View>
        <Text style={[styles.priorityText, { color: priorityBorderColor(item.priority) }]}>
          <Text style={styles.label}>Priority: </Text>{item.priority?.charAt(0).toUpperCase() + item.priority?.slice(1)}
        </Text>
        {item.category && <Text><Text style={styles.label}>Category: </Text>{item.category}</Text>}
        <Text><Text style={styles.label}>Assigned To: </Text>{assignedDisplay}</Text>
        <Text><Text style={styles.label}>Creator: </Text>{item.createdByUsername || 'N/A'}</Text>
      </TouchableOpacity>
    );
  };

  const FilterBar = ({ label, options, selected, onSelect }) => (
    <View style={styles.filterRow}>
      <Text style={styles.filterLabel}>{label}:</Text>
      {options.map(option => (
        <TouchableOpacity
          key={option.value}
          style={[styles.filterButton, selected === option.value && styles.filterButtonActive]}
          onPress={() => onSelect(option.value)}
        >
          <Text style={selected === option.value ? styles.filterTextActive : styles.filterText}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Tasks for {role}</Text>

      <FilterBar
        label="Status"
        selected={statusFilter}
        onSelect={setStatusFilter}
        options={[
          { label: 'All', value: '' },
          { label: 'To Do', value: 'todo' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Completed', value: 'completed' }
        ]}
      />

      <FilterBar
        label="Priority"
        selected={priorityFilter}
        onSelect={setPriorityFilter}
        options={[
          { label: 'All', value: '' },
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' }
        ]}
      />

      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Category:</Text>
        <Picker
          selectedValue={categoryFilter}
          style={{ flex: 1 }}
          onValueChange={setCategoryFilter}
        >
          <Picker.Item label="All" value="" />
          {categories.map((cat, idx) => (
            <Picker.Item key={idx} label={cat} value={cat} />
          ))}
        </Picker>
      </View>

      {role === 'admin' && (
        <View style={styles.buttonWrapper}>
          <Text
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateTask', { token, role })}
          >
            ➕ Create Task
          </Text>
        </View>
      )}

      <FlatList
        data={filteredTasks}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text>No tasks match your filters.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 24, marginBottom: 10, fontWeight: 'bold', color: '#333' },
  card: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 4,
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  label: { fontWeight: 'bold' },
  priorityText: { fontWeight: 'bold', marginVertical: 4 },
  error: { color: 'red', padding: 20, textAlign: 'center' },
  buttonWrapper: { alignItems: 'flex-end', marginBottom: 10 },
  createButton: { color: '#007bff', fontSize: 16, fontWeight: 'bold' },
  logoutButton: { marginRight: 15, color: '#dc3545', fontSize: 16, fontWeight: 'bold' },
  progressBar: {
    height: 8, backgroundColor: '#ddd', borderRadius: 4,
    overflow: 'hidden', marginVertical: 6
  },
  progressFill: { height: '100%', backgroundColor: '#4caf50' },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  filterLabel: { marginRight: 8, fontWeight: 'bold', color: '#444' },
  filterButton: {
    borderWidth: 1, borderColor: '#aaa', borderRadius: 14,
    paddingVertical: 4, paddingHorizontal: 10,
    marginRight: 6, marginBottom: 4
  },
  filterButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff'
  },
  filterText: { color: '#007bff' },
  filterTextActive: { color: '#fff', fontWeight: 'bold' }
});
