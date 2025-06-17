import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    try {
      await axios.post('http://10.0.2.2:5000/api/auth/register', {
        username,
        password,
        role
      });
      navigation.navigate('Login');
    } catch (err) {
      console.log('Register error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create an Account</Text>
      <Text style={styles.subtitle}>Fill in the details to register</Text>

      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        placeholderTextColor="#888"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>Select Role:</Text>
      <Picker
        selectedValue={role}
        onValueChange={(value) => setRole(value)}
        style={styles.input}
      >
        <Picker.Item label="User" value="user" />
        <Picker.Item label="Admin" value="admin" />
      </Picker>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.loginButton]}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.buttonText}>Go to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f6fa',
    justifyContent: 'center'
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#2f3640'
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: '#718093'
  },
  input: {
    borderWidth: 1,
    borderColor: '#dcdde1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#fff'
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#555'
  },
  button: {
    backgroundColor: '#44bd32',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 5
  },
  loginButton: {
    backgroundColor: '#40739e'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  error: {
    color: '#e84118',
    textAlign: 'center',
    marginBottom: 10
  }
});
