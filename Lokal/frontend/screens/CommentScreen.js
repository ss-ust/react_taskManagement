import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';

export default function CommentScreen({ route }) {
  const { token, taskId } = route.params;

  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const fetchComments = async () => {
    try {
      const res = await axios.get(`http://10.0.2.2:5000/api/comments/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(res.data);
    } catch (err) {
      setError('Failed to load comments');
    }
  };

  const postComment = async () => {
    if (!text.trim()) return;

    try {
      await axios.post(`http://10.0.2.2:5000/api/comments/${taskId}`, { text }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setText('');
      fetchComments(); // refresh after posting
    } catch (err) {
      setError(err.response?.data?.message || 'Comment failed');
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.commentBox}>
      <Text style={styles.author}>{item.username}</Text>
      <Text>{item.text}</Text>
      <Text style={styles.timestamp}>{item.createdAt}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Comments</Text>

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text>No comments yet.</Text>}
      />

      <TextInput
        placeholder="Write a comment..."
        value={text}
        onChangeText={setText}
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Post Comment" onPress={postComment} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1 },
  header: { fontSize: 24, marginBottom: 10 },
  input: { borderWidth: 1, padding: 10, marginTop: 10, marginBottom: 5 },
  error: { color: 'red', marginBottom: 10 },
  commentBox: {
    backgroundColor: '#eaeaea',
    padding: 10,
    marginBottom: 10,
    borderRadius: 6
  },
  author: { fontWeight: 'bold' },
  timestamp: { fontSize: 10, color: '#666', marginTop: 2 }
});
