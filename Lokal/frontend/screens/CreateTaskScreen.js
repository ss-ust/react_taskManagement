import React, { useState, useEffect } from 'react';
import {
  View, TextInput, Button, Text, StyleSheet,
  Pressable, Alert, ScrollView
} from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateTaskScreen({ route, navigation }) {
  const { token, role } = route.params;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [priority, setPriority] = useState('medium');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [error, setError] = useState('');

  // Separate states for showing each date picker
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showDuePicker, setShowDuePicker] = useState(false);

  const parseDate = (str) => str ? new Date(str) : new Date();

  const onStartDateChange = (event, selectedDate) => {
    setShowStartPicker(false);
    if (event.type === 'dismissed') return;
    const isoDate = selectedDate.toISOString().split('T')[0];
    setStartDate(isoDate);
    // If dueDate exists and is before new startDate, reset dueDate
    if (dueDate && new Date(dueDate) < new Date(isoDate)) {
      setDueDate('');
    }
  };

  const onDueDateChange = (event, selectedDate) => {
    setShowDuePicker(false);
    if (event.type === 'dismissed') return;
    const isoDate = selectedDate.toISOString().split('T')[0];
    // Prevent dueDate before startDate
    if (startDate && new Date(isoDate) < new Date(startDate)) {
      Alert.alert('Invalid Dates', 'Due date cannot be earlier than start date.');
      return;
    }
    setDueDate(isoDate);
  };

  const toggleUserAssignment = (userId) => {
    setAssignedTo(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a task title.');
      return;
    }

    if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) {
      Alert.alert('Invalid Dates', 'Due date cannot be earlier than start date.');
      return;
    }

    try {
      const finalCategory = newCategory.trim() !== '' ? newCategory.trim() : category;

      const payload = {
        title,
        description,
        category: finalCategory,
        priority,
        startDate,
        dueDate,
        ...(role === 'admin' ? { assignedTo: assignedTo.join(',') } : {}),
      };

      setError('');
      await axios.post('http://10.0.2.2:5000/api/tasks', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      navigation.navigate('Tasks', { token, role });
    } catch (err) {
      setError(err.response?.data?.message || 'Task creation failed');
    }
  };

  useEffect(() => {
    axios.get('http://10.0.2.2:5000/api/tasks/categories', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setCategories(res.data))
      .catch(() => { });

    if (role === 'admin') {
      axios.get('http://10.0.2.2:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => setUsers(res.data))
        .catch(() => { });
    }
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Task</Text>

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

      {role === 'admin' && (
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

      <Button title="Create Task" onPress={handleCreate} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
    backgroundColor: '#fff'
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
  }
});
