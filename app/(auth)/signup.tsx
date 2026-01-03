import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { showAlert } from '@/lib/alert';
import { colors, fonts } from '@/lib/theme';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const router = useRouter();

  const handleSignup = async () => {
    setMessage(null);
    
    if (!email || !password || !fullName) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      // Check if email confirmation is required
      if (data.user && !data.session) {
        setMessage({ type: 'success', text: 'Account created! Please check your email to verify your account.' });
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 3000);
      } else if (data.session) {
        // Auto-confirmed (email confirmation disabled in Supabase)
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to create account' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Logo/Header */}
            <View style={styles.header}>
              <Text style={styles.logo}>THE ROOM</Text>
              <Text style={styles.subtitle}>Create an account</Text>
            </View>

            {/* Message */}
            {message && (
              <View style={[
                styles.messageBox,
                message.type === 'error' ? styles.errorBox : styles.successBox
              ]}>
                <Text style={styles.messageText}>{message.text}</Text>
              </View>
            )}

            {/* Form */}
            <View style={styles.form}>
              <TextInput
                placeholder="Full Name"
                placeholderTextColor="#666666"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                style={styles.input}
              />

              <TextInput
                placeholder="Email"
                placeholderTextColor="#666666"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />

              <TextInput
                placeholder="Password (min. 6 characters)"
                placeholderTextColor="#666666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
              />

              <TouchableOpacity
                onPress={handleSignup}
                disabled={loading}
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color={colors.black} />
                ) : (
                  <Text style={styles.buttonText}>Sign Up</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Sign In Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkText}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  logo: {
    color: colors.white,
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: fonts.serif,
    letterSpacing: 2,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontFamily: fonts.sans,
  },
  messageBox: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.5)',
  },
  successBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  messageText: {
    color: colors.white,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: fonts.sans,
  },
  form: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: colors.paper,
    color: colors.black,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: fonts.sans,
  },
  button: {
    backgroundColor: colors.white,
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: colors.black,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: fonts.sans,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginBottom: 8,
    fontFamily: fonts.sans,
  },
  linkText: {
    color: colors.white,
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontFamily: fonts.sans,
  },
});
