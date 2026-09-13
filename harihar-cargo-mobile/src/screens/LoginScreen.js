import React, { useState, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useContext(AuthContext);

  const handleLogin = (selectedRole) => {
    const targetEmail = selectedRole ? `${selectedRole}@harihar.com` : email;
    if (!targetEmail || (!password && !selectedRole)) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    login(targetEmail, password || '123456');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brandTitle}>HARIHAR CARGO</Text>
      <Text style={styles.brandSubtitle}>Mobile Logistics Portal</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => handleLogin()}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Quick Role Fillers for Rapid Testing */}
        <Text style={styles.devHint}>Quick Dev Login:</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleBadge, { backgroundColor: '#d97706' }]}
            onPress={() => handleLogin('admin')}
          >
            <Text style={styles.roleText}>Admin</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBadge, { backgroundColor: '#2563eb' }]}
            onPress={() => handleLogin('manager')}
          >
            <Text style={styles.roleText}>Manager</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBadge, { backgroundColor: '#16a34a' }]}
            onPress={() => handleLogin('driver')}
          >
            <Text style={styles.roleText}>Driver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#0f172a',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 40,
    marginTop: 4,
  },
  form: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 16,
  },
  input: {
    backgroundColor: '#334155',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 15,
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  devHint: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 0.3,
    alignItems: 'center',
  },
  roleText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
});