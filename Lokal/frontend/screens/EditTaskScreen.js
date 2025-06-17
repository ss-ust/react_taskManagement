import React, { useState, useEffect } from 'react';
import {
  View, TextInput, Button, Text, StyleSheet,
  Pressable, Alert, ScrollView
} from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';

export default function EditTaskScreen({ route, navigation }) {
  const { token, role, task, allowProgressOnly } = route.params;

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [category, setCategory] = useState(task.category);
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [priority, setPriority] = useState(task.priority);
  const [status, setStatus] = useState(task.status);
  const [progress, setProgress] = useState(task.progress);
  const [startDate, setStartDate] = useState(task.startDate);
  const [dueDate, setDueDate] = useState(task.dueDate);
  const [assignedTo, setAssignedTo] = useState(task.assignedUserIds || []);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Separate date picker states
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showDuePicker, setShowDuePicker] = useState(false);

  const parseDate = (str) => str ? new Date(str) : new Date();

  const toggleUserAssignment = (userId) => {
    setAssignedTo(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const onStartDateChange = (event, selectedDate) => {
    setShowStartPicker(false);
    if (event.type === 'dismissed') return;
    const isoDate = selectedDate.toISOString().split('T')[0];
    setStartDate(isoDate);
    if (dueDate && new Date(dueDate) < new Date(isoDate)) {
      setDueDate('');
    }
  };

  const onDueDateChange = (event, selectedDate) => {
    setShowDuePicker(false);
    if (event.type === 'dismissed') return;
    const isoDate = selectedDate.toISOString().split('T')[0];
    if (startDate && new Date(isoDate) < new Date(startDate)) {
      Alert.alert('Invalid Dates', 'Due date cannot be earlier than start date.');
      return;
    }
    setDueDate(isoDate);
  };

  const updateTask = async () => {
    if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) {
      Alert.alert('Invalid Dates', 'Due date cannot be earlier than start date.');
      return;
    }

    try {
      const finalCategory = newCategory.trim() !== '' ? newCategory.trim() : category;

      const payload = allowProgressOnly
        ? { progress, status }
        : {
            title,
            description,
            category: finalCategory,
            priority,
            status,
            progress,
            startDate,
            dueDate,
            ...(role === 'admin' ? { assignedTo: assignedTo.join(',') } : {})
          };

      setIsSaving(true);
      setError('');
      await axios.put(`http://10.0.2.2:5000/api/tasks/${task.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTimeout(() => {
        navigation.navigate('Tasks', { token, role, userId: task.createdBy, refresh: true });
      }, 1000);

    } catch (err) {
      setError(err.response?.data?.message || 'Task update failed');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!allowProgressOnly) {
      axios.get('http://10.0.2.2:5000/api/tasks/categories', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setCategories(res.data)).catch(() => { });

      if (role === 'admin') {
        axios.get('http://10.0.2.2:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => setUsers(res.data)).catch(() => { });
      }
    }
  }, []);

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Task</Text>

      {!allowProgressOnly && (
        <>
          <TextInput
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />
          <TextInput
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            style={[styles.input, { height: 100 }]}
            multiline
          />

          <Text style={styles.label}>Category:</Text>
          <Picker
            selectedValue={category}
            onValueChange={setCategory}
            style={styles.picker}
          >
            <Picker.Item label="Select category" value="" />
            {categories.map((cat, idx) => (
              <Picker.Item key={idx} label={cat} value={cat} />
            ))}
          </Picker>

          <TextInput
            placeholder="Or create new category"
            value={newCategory}
            onChangeText={setNewCategory}
            style={styles.input}
          />

          <Text style={styles.label}>Priority:</Text>
          <Picker
            selectedValue={priority}
            onValueChange={setPriority}
            style={styles.picker}
          >
            <Picker.Item label="Low" value="low" />
            <Picker.Item label="Medium" value="medium" />
            <Picker.Item label="High" value="high" />
          </Picker>

          <View style={styles.dateRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>Start Date:</Text>
              <Pressable style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
                <Text>{startDate || 'Select Start Date'}</Text>
              </Pressable>
              {showStartPicker && (
                <DateTimePicker
                  value={parseDate(startDate)}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={onStartDateChange}
                />
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Due Date:</Text>
              <Pressable style={styles.dateButton} onPress={() => setShowDuePicker(true)}>
                <Text>{dueDate || 'Select Due Date'}</Text>
              </Pressable>
              {showDuePicker && (
                <DateTimePicker
                  value={parseDate(dueDate)}
                  mode="date"
                  display="default"
                  minimumDate={startDate ? parseDate(startDate) : new Date()}
                  onChange={onDueDateChange}
                />
              )}
            </View>
          </View>
        </>
      )}

      <Text style={styles.label}>Status:</Text>
      <Picker
        selectedValue={status}
        onValueChange={setStatus}
        style={styles.picker}
      >
        <Picker.Item label="To Do" value="todo" />
        <Picker.Item label="In Progress" value="in_progress" />
        <Picker.Item label="Completed" value="completed" />
      </Picker>

      <Text style={styles.label}>Progress: {progress}%</Text>
      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={progress}
        onValueChange={value => {
          setProgress(value);
          if (value >= 100) setStatus('completed');
          else if (value > 0) setStatus('in_progress');
          else setStatus('todo');
        }}
        minimumTrackTintColor="#007bff"
        maximumTrackTintColor="#ccc"
      />

      {!allowProgressOnly && role === 'admin' && (
        <>
          <Text style={styles.label}>Search Users:</Text>
          <TextInput
            placeholder="Search by username..."
            value={userSearch}
            onChangeText={setUserSearch}
            style={styles.input}
          />
          {filteredUsers.map(u => (
            <Pressable
              key={u.id}
              style={[styles.userOption, assignedTo.includes(u.id) && styles.userOptionSelected]}
              onPress={() => toggleUserAssignment(u.id)}
            >
              <Text>{`${u.username} (${u.role})`}</Text>
            </Pressable>
          ))}
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {isSaving && <Text style={styles.savingText}>Saving...</Text>}

      <Button title="Save Changes" onPress={updateTask} disabled={isSaving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
    borderColor: '#ccc'
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: '#f9f9f9'
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  dateButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#eef2f5',
    alignItems: 'center'
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#555'
  },
  userOption: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 5
  },
  userOptionSelected: {
    backgroundColor: '#cce5ff',
    borderColor: '#007bff'
  },
  error: {
    color: 'red',
    marginVertical: 10,
    textAlign: 'center'
  },
  savingText: {
    color: 'green',
    marginBottom: 10,
    textAlign: 'center'
  }
});
