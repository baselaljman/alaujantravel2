import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithEmail, registerWithEmail } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    setError('');
    if (!email || !password) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    if (isSignUp && !displayName) {
      setError('يرجى إدخال اسمك الكامل للتسجيل');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await registerWithEmail(email.trim(), password, displayName.trim());
      } else {
        await loginWithEmail(email.trim(), password);
      }
      // Successful login auto redirects via the Index Dispatcher
    } catch (err: any) {
      let friendlyError = 'خطأ أثناء المصادقة، يرجى التحقق من المدخلات والمحاولة لاحقاً';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyError = 'كلمة المرور أو البريد الإلكتروني غير صحيح';
      } else if (err.code === 'auth/user-not-found') {
        friendlyError = 'لا يوجد حساب مسجل بهذا البريد الإلكتروني';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyError = 'البريد الإلكتروني مستخدم بالفعل في حساب آخر';
      } else if (err.code === 'auth/invalid-email') {
        friendlyError = 'البريد الإلكتروني المكتوب غير صالح';
      } else if (err.code === 'auth/weak-password') {
        friendlyError = 'كلمة المرور ضعيفة جداً، يرجى استخدام 6 رموز على الأقل';
      }
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-stone-50" contentContainerStyle={{ paddingVertical: 24, paddingHorizontal: 24 }}>
      <View className="items-center mb-8">
        <View className="h-16 w-16 bg-emerald-600 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-emerald-200">
          <Lock color="#fff" size={28} />
        </View>
        <Text className="text-stone-900 font-extrabold text-2xl text-center mb-2">
          {isSignUp ? 'إنشاء حساب جديد' : 'مرحباً بك مجدداً'}
        </Text>
        <Text className="text-stone-500 text-sm text-center">
          {isSignUp ? 'سجل بياناتك للبدء في حجز رحلاتك وإدارة طرودك' : 'سجل دخولك الآن لمتابعة حجوزاتك ومسار شحناتك'}
        </Text>
      </View>

      {/* Form Card */}
      <View className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-4">
        {/* Name input (SignUp only) */}
        {isSignUp && (
          <View className="space-y-1">
            <Text className="text-right text-stone-700 font-bold text-xs pr-1">الاسم الكامل</Text>
            <View className="flex-row items-center border border-stone-200 bg-stone-50 rounded-xl px-3 h-12 text-right">
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="مثال: محمد علي"
                placeholderTextColor="#a8a29e"
                className="flex-1 text-right text-stone-800 font-bold text-sm h-full"
              />
              <User color="#57534e" size={18} />
            </View>
          </View>
        )}

        {/* Email Input */}
        <View className="space-y-1">
          <Text className="text-right text-stone-700 font-bold text-xs pr-1">البريد الإلكتروني</Text>
          <View className="flex-row items-center border border-stone-200 bg-stone-50 rounded-xl px-3 h-12">
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="example@mail.com"
              placeholderTextColor="#a8a29e"
              keyboardType="email-address"
              autoCapitalize="none"
              className="flex-1 text-right text-stone-800 font-bold text-sm h-full"
            />
            <Mail color="#57534e" size={18} />
          </View>
        </View>

        {/* Password Input */}
        <View className="space-y-1">
          <Text className="text-right text-stone-700 font-bold text-xs pr-1">كلمة المرور</Text>
          <View className="flex-row items-center border border-stone-200 bg-stone-50 rounded-xl px-3 h-12">
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="pr-1">
              {showPassword ? <EyeOff color="#a8a29e" size={18} /> : <Eye color="#a8a29e" size={18} />}
            </TouchableOpacity>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#a8a29e"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              className="flex-1 text-right text-stone-800 font-bold text-sm h-full"
            />
            <Lock color="#57534e" size={18} />
          </View>
        </View>

        {/* Error Notification */}
        {error ? (
          <View className="bg-red-50 border border-red-100 p-3 rounded-xl flex-row items-center justify-end space-x-2">
            <Text className="text-red-700 font-bold text-xs flex-1 text-right">{error}</Text>
            <AlertCircle color="#dc2626" size={16} />
          </View>
        ) : null}

        {/* Submit Button */}
        <TouchableOpacity 
          onPress={handleAuth} 
          disabled={loading}
          className="bg-emerald-600 h-12 rounded-xl items-center justify-center shadow-lg shadow-emerald-200 active:opacity-90 mt-4"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-extrabold text-base">
              {isSignUp ? 'إنشاء الحساب' : 'تسجيل الدخول'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Switch Auth mode */}
        <TouchableOpacity 
          onPress={() => {
            setIsSignUp(!isSignUp);
            setError('');
          }}
          className="pt-2"
        >
          <Text className="text-center text-emerald-600 font-extrabold text-sm">
            {isSignUp ? 'لديك حساب بالفعل؟ سجل دخولك' : 'ليس لديك حساب؟ قم بإنشاء حساب جديد الآن'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
