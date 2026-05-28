import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { db, collection, onSnapshot, query } from '../firebase';
import { Trip, Booking, Parcel, UserProfile } from '../types';
import { Users, Compass, Package, Award, ArrowLeft, RefreshCw, Layers } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function AdminDashboard() {
  const router = useRouter();

  const [tripsCount, setTripsCount] = useState(0);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [parcelsCount, setParcelsCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubTrips = onSnapshot(collection(db, 'trips'), (snap) => {
      setTripsCount(snap.size);
    });

    const unsubBookings = onSnapshot(collection(db, 'bookings'), (snap) => {
      setBookingsCount(snap.size);
    });

    const unsubParcels = onSnapshot(collection(db, 'parcels'), (snap) => {
      setParcelsCount(snap.size);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsersCount(snap.size);
      setLoading(false);
    });

    return () => {
      unsubTrips();
      unsubBookings();
      unsubParcels();
      unsubUsers();
    };
  }, []);

  return (
    <ScrollView className="flex-1 bg-stone-50" contentContainerStyle={{ paddingVertical: 24, paddingHorizontal: 24 }}>
      {/* Admin Title Banner */}
      <View className="flex-row items-center justify-between border-b border-stone-200 pb-4 mb-6">
        <TouchableOpacity onPress={() => router.replace('/home')} className="bg-stone-100 p-2 rounded-xl">
          <ArrowLeft color="#57534e" size={18} />
        </TouchableOpacity>
        <Text className="text-stone-900 font-extrabold text-lg">لوحة الإشراف والمراقبة</Text>
      </View>

      <Text className="text-right text-stone-500 text-xs mb-6 leading-5">مرحباً بك في النظام الإداري الموحد. يمكنك الإشراف على كامل مؤشرات النشاط، وإجمالي عدد الحجوزات، والرحلات المسجلة في قواعد بيانات السحاب المباشرة.</Text>

      {/* Grid of Indicator Stats Cards */}
      <View className="space-y-4">
        {loading ? (
          <ActivityIndicator color="#10b981" style={{ marginVertical: 40 }} />
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {/* Cards trip counts */}
            <View className="w-[48%] bg-white p-5 rounded-3xl border border-stone-100 shadow-sm mb-4 justify-center items-end">
              <View className="bg-emerald-50 h-10 w-10 rounded-xl items-center justify-center mb-3">
                <Compass color="#059669" size={20} />
              </View>
              <Text className="text-stone-400 text-[10px] text-right">إجمالي الرحلات</Text>
              <Text className="text-stone-900 font-black text-xl text-right mt-1">{tripsCount}</Text>
            </View>

            {/* Bookings Card counts */}
            <View className="w-[48%] bg-white p-5 rounded-3xl border border-stone-100 shadow-sm mb-4 justify-center items-end">
              <View className="bg-amber-50 h-10 w-10 rounded-xl items-center justify-center mb-3">
                <Users color="#d97706" size={20} />
              </View>
              <Text className="text-stone-400 text-[10px] text-right">إجمالي الحجوزات</Text>
              <Text className="text-stone-900 font-black text-xl text-right mt-1">{bookingsCount}</Text>
            </View>

            {/* Parcels Card count */}
            <View className="w-[48%] bg-white p-5 rounded-3xl border border-stone-100 shadow-sm mb-4 justify-center items-end">
              <View className="bg-stone-100 h-10 w-10 rounded-xl items-center justify-center mb-3">
                <Package color="#78716c" size={20} />
              </View>
              <Text className="text-stone-400 text-[10px] text-right">الطرود المسجلة</Text>
              <Text className="text-stone-900 font-black text-xl text-right mt-1">{parcelsCount}</Text>
            </View>

            {/* Users counts */}
            <View className="w-[48%] bg-white p-5 rounded-3xl border border-stone-100 shadow-sm mb-4 justify-center items-end">
              <View className="bg-blue-50 h-10 w-10 rounded-xl items-center justify-center mb-3">
                <Layers color="#2563eb" size={20} />
              </View>
              <Text className="text-stone-400 text-[10px] text-right">المستخدمون المسجلون</Text>
              <Text className="text-stone-900 font-black text-xl text-right mt-1">{usersCount}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Security note section */}
      <View className="bg-stone-900 p-5 rounded-3xl mt-4 flex-row justify-between items-center border border-stone-800">
        <View className="bg-emerald-900/30 p-2.5 rounded-2xl mr-4">
          <Award color="#10b981" size={24} />
        </View>
        <View className="flex-1">
          <Text className="text-white text-right font-extrabold text-xs mb-1">بيئة سحابية مشفرة بالكامل</Text>
          <Text className="text-stone-400 text-right text-[10px] leading-4">كافة الصلاحيات مطبقة بدقة من خلال قواعد حماية Firestore لضمان أعلى مستويات الأمان ومكافحة الانتهاكات.</Text>
        </View>
      </View>
    </ScrollView>
  );
}
