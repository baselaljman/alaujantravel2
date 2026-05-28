import React, { useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Globe, Plane, ShieldCheck, MapPin, Tracking, Phone, Navigation, ArrowRight } from 'lucide-react-native';

export default function IndexScreen() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  // Handle automatic dispatching based on authenticated role
  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role === 'admin' || profile.role === 'staff') {
        router.replace('/admin');
      } else if (profile.role === 'driver') {
        router.replace('/driver');
      } else {
        router.replace('/home');
      }
    }
  }, [user, profile, loading]);

  if (loading) {
    return (
      <View className="flex-1 bg-stone-900 justify-center items-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-stone-300 font-sans mt-4 text-base">جاري تحميل البيانات...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-stone-50" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Hero Banner Section */}
      <View className="relative h-72 bg-stone-900 overflow-hidden rounded-b-[36px] items-center justify-center px-6">
        {/* Subtle decorative background pattern */}
        <View className="absolute inset-0 bg-emerald-950 opacity-40" />
        <View className="absolute top-1/4 right-1/4 w-60 h-60 bg-emerald-600 rounded-full filter blur-3xl opacity-20" />
        
        <View className="z-10 items-center">
          <Text className="text-emerald-400 font-bold text-lg mb-2 tracking-widest text-center">
            العوجان للسياحة والسفر
          </Text>
          <Text className="text-white text-3xl font-extrabold text-center leading-10 px-4">
            سافر بأمان وراحة {"\n"} مع العوجان
          </Text>
          <Text className="text-stone-300 text-sm text-center mt-3">
            تطبيق حجز الرحلات الدولية وتتبع الطرود والشحنات
          </Text>
        </View>
      </View>

      {/* Main Actions Container */}
      <View className="px-6 -mt-8">
        <View className="bg-white rounded-3xl p-6 shadow-xl shadow-stone-200 border border-stone-100/50 space-y-4">
          <Text className="text-right text-stone-800 font-extrabold text-lg mb-2">
            ماذا تريد أن تفعل اليوم؟
          </Text>

          {/* Quick Booking Button */}
          <TouchableOpacity 
            onPress={() => router.push('/booking')}
            className="flex-row items-center justify-between bg-emerald-600 p-5 rounded-2xl active:opacity-90"
          >
            <View className="bg-emerald-500/30 p-2 rounded-xl">
              <Globe color="#fff" size={24} />
            </View>
            <View className="flex-1 pr-4">
              <Text className="text-white font-extrabold text-right text-base mb-1">
                حجز رحلة جديدة
              </Text>
              <Text className="text-emerald-100 text-right text-xs">
                استكشف الرحلات والوجهات واحجز مقعدك فوراً
              </Text>
            </View>
          </TouchableOpacity>

          {/* Quick Tracking Button */}
          <TouchableOpacity 
            onPress={() => router.push('/tracking')}
            className="flex-row items-center justify-between bg-stone-900 p-5 rounded-2xl active:opacity-90"
          >
            <View className="bg-stone-800 p-2 rounded-xl">
              <Navigation color="#10b981" size={24} />
            </View>
            <View className="flex-1 pr-4">
              <Text className="text-white font-extrabold text-right text-base mb-1">
                تتبع الطرود والشحنات
              </Text>
              <Text className="text-stone-300 text-right text-xs">
                أدخل رقم الشحنة لمراقبة خط سيرها المباشر
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Features Showcase */}
      <View className="mt-8 px-6 space-y-4">
        <Text className="text-right text-stone-800 font-extrabold text-lg mb-2">
          لماذا تختار العوجان؟
        </Text>

        <View className="flex-row justify-between flex-wrap">
          {/* Card 1 */}
          <View className="w-[48%] bg-white p-4 rounded-2xl border border-stone-100 shadow-sm items-end mb-4">
            <View className="bg-emerald-50 p-2.5 rounded-xl mb-3">
              <ShieldCheck color="#059669" size={20} />
            </View>
            <Text className="font-extrabold text-stone-800 text-sm mb-1 text-right">أمان تام</Text>
            <Text className="text-stone-500 text-[10px] text-right leading-4">
              أسطول حديث مجهز بأفضل وسائل السلامة والراحة لرحلتك.
            </Text>
          </View>

          {/* Card 2 */}
          <View className="w-[48%] bg-white p-4 rounded-2xl border border-stone-100 shadow-sm items-end mb-4">
            <View className="bg-emerald-50 p-2.5 rounded-xl mb-3">
              <Phone color="#059669" size={20} />
            </View>
            <Text className="font-extrabold text-stone-800 text-sm mb-1 text-right">خدمة 24/7</Text>
            <Text className="text-stone-500 text-[10px] text-right leading-4">
              فريق دعم ومساعدة متكامل مستعد لخدمتك على مدار الساعة وكل أيام الأسبوع.
            </Text>
          </View>
        </View>
      </View>

      {/* Sign In Banner */}
      <View className="mt-4 px-6">
        <TouchableOpacity 
          onPress={() => router.push('/login')}
          className="bg-emerald-50 border border-emerald-100 p-5 rounded-3xl flex-row items-center justify-between"
        >
          <View className="bg-emerald-600 p-2 rounded-full">
            <ArrowRight color="#fff" size={16} />
          </View>
          <View className="flex-1 pr-4 items-end">
            <Text className="text-emerald-900 font-extrabold text-sm mb-1">
              لديك حساب بالفعل؟
            </Text>
            <Text className="text-emerald-700 text-xs">
              سجل دخولك الآن لمتابعة حجوزاتك وإعدادات حسابك الشخصي
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
