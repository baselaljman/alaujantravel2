import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { db, collection, onSnapshot, query, where, doc } from '../firebase';
import { City, Banner, Booking, Trip } from '../types';
import { LogOut, User, Compass, MapPin, Calendar, Clock, RotateCw, Ticket, Package } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { user, profile, logout } = useAuth();

  const [cities, setCities] = useState<City[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [tripsMap, setTripsMap] = useState<Record<string, Trip>>({});
  const [loading, setLoading] = useState(true);

  // Fetch Cities and Banners
  useEffect(() => {
    const unsubCities = onSnapshot(collection(db, 'cities'), (snapshot) => {
      const citiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as City));
      setCities(citiesData);
    });

    const unsubBanners = onSnapshot(collection(db, 'banners'), (snapshot) => {
      const bannersData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Banner))
        .filter(b => b.active)
        .sort((a, b) => a.order - b.order);
      setBanners(bannersData);
    });

    return () => {
      unsubCities();
      unsubBanners();
    };
  }, []);

  // Fetch real-time user bookings
  useEffect(() => {
    if (!user) return;

    const bookingQuery = query(
      collection(db, 'bookings'),
      where('userId', '==', user.uid)
    );

    const unsubBookings = onSnapshot(bookingQuery, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setActiveBookings(bookingsData);
      setLoading(false);

      // Fetch corresponding trips
      bookingsData.forEach((booking) => {
        if (booking.tripId) {
          onSnapshot(doc(db, 'trips', booking.tripId), (tripDoc) => {
            if (tripDoc.exists()) {
              setTripsMap(prev => ({
                ...prev,
                [booking.tripId]: { id: tripDoc.id, ...tripDoc.data() } as Trip
              }));
            }
          });
        }
      });
    }, (err) => {
      console.error("Home bookings fetch error: ", err);
      setLoading(false);
    });

    return () => {
      unsubBookings();
    };
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من رغبتك في تسجيل الخروج من التطبيق؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'خروج', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          }
        }
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-stone-50" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Upper header user profile component */}
      <View className="bg-stone-900 px-6 pt-4 pb-8 rounded-b-[32px] flex-row items-center justify-between">
        <TouchableOpacity 
          onPress={handleLogout}
          className="bg-stone-800 p-2.5 rounded-xl border border-stone-700/50"
        >
          <LogOut color="#f87171" size={18} />
        </TouchableOpacity>

        <View className="flex-row items-center space-x-3">
          <View className="items-end">
            <Text className="text-stone-400 text-xs">مرحباً بك</Text>
            <Text className="text-white font-extrabold text-base">{profile?.displayName || 'مسافر العوجان'}</Text>
          </View>
          <View className="h-11 w-11 bg-emerald-600 rounded-xl items-center justify-center border border-emerald-500/20 ml-2">
            <User color="#fff" size={20} />
          </View>
        </View>
      </View>

      {/* Dynamic Slide Banner Panel */}
      {banners.length > 0 && (
        <View className="mt-6 px-6">
          <Text className="text-right text-stone-800 font-extrabold text-base mb-3 pr-1">آخر العروض والإعلانات</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="space-x-4 pl-1" contentContainerStyle={{ flexDirection: 'row-reverse' }}>
            {banners.map((banner) => (
              <View key={banner.id} className="w-80 h-36 rounded-2xl overflow-hidden bg-stone-200 border border-stone-100 mr-4">
                <Image 
                  source={{ uri: banner.imageUrl }} 
                  className="w-full h-full object-cover"
                  style={{ resizeMode: 'cover' }}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Grid of central shortcuts */}
      <View className="mt-6 px-6 grid grid-cols-2 flex-row justify-between">
        <TouchableOpacity 
          onPress={() => router.push('/booking')}
          className="w-[48%] bg-white border border-emerald-100 p-5 rounded-2xl items-center justify-center shadow-sm"
        >
          <View className="bg-emerald-50 p-3 rounded-2xl mb-2">
            <Compass color="#059669" size={24} />
          </View>
          <Text className="font-extrabold text-stone-800 text-sm">حجز رحلة جديدة</Text>
          <Text className="text-stone-400 text-[10px] mt-1 text-center">خدمة حجز المقاعد السهلة</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push('/tracking')}
          className="w-[48%] bg-white border border-stone-100 p-5 rounded-2xl items-center justify-center shadow-sm"
        >
          <View className="bg-stone-100 p-3 rounded-2xl mb-2">
            <Package color="#78716c" size={24} />
          </View>
          <Text className="font-extrabold text-stone-800 text-sm">تتبع الشحنات</Text>
          <Text className="text-stone-400 text-[10px] mt-1 text-center">أدخل رقم التتبع لشحنتك</Text>
        </TouchableOpacity>
      </View>

      {/* Real-time users active bookings */}
      <View className="mt-8 px-6">
        <Text className="text-right text-stone-800 font-extrabold text-base mb-3 pr-1">حجوزاتي الحالية</Text>

        {loading ? (
          <ActivityIndicator size="small" color="#10b981" />
        ) : activeBookings.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 border border-stone-100 border-dashed items-center justify-center">
            <Ticket color="#a8a29e" size={32} />
            <Text className="text-stone-400 font-bold text-sm mt-3 text-center">ليس لديك أي حجوزات نشطة حالياً.</Text>
            <TouchableOpacity 
              onPress={() => router.push('/booking')}
              className="mt-3 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100"
            >
              <Text className="text-emerald-700 font-extrabold text-xs">احجز رحلتك الأولى الآن</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="space-y-3">
            {activeBookings.map((booking) => {
              const trip = tripsMap[booking.tripId];
              return (
                <View key={booking.id} className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm space-y-3">
                  <View className="flex-row items-center justify-between border-b border-stone-100 pb-2.5">
                    <View className="flex-row items-center space-x-1.5 bg-emerald-50 px-3 py-1 rounded-full">
                      <Text className="text-emerald-700 font-extrabold text-xs">مقعد {booking.seatNumber}</Text>
                    </View>
                    <Text className="text-stone-800 font-extrabold text-sm">{booking.passengerName}</Text>
                  </View>

                  <View className="flex-row justify-between items-center py-1">
                    <View className="items-start">
                      <Text className="text-stone-400 text-[10px]">الوجهة</Text>
                      <Text className="text-stone-800 font-extrabold text-sm">{booking.to || trip?.to || '---'}</Text>
                    </View>

                    <View className="h-0.5 flex-1 bg-stone-100 mx-4 relative">
                      <View className="absolute top-1/2 left-1/2 -mt-1 -ml-1 h-2 w-2 rounded-full bg-emerald-600" />
                    </View>

                    <View className="items-end">
                      <Text className="text-stone-400 text-[10px]">الانطلاق من</Text>
                      <Text className="text-stone-800 font-extrabold text-sm">{booking.from || trip?.from || '---'}</Text>
                    </View>
                  </View>

                  {trip && (
                    <View className="flex-row items-center justify-between bg-stone-50 rounded-xl p-2.5">
                      <View className="flex-row items-center space-x-1">
                        <Clock color="#78716c" size={14} />
                        <Text className="text-stone-600 font-bold text-xs ml-1">{trip.time}</Text>
                      </View>
                      <View className="flex-row items-center space-x-1">
                        <Calendar color="#78716c" size={14} />
                        <Text className="text-stone-600 font-bold text-xs ml-1">{trip.date}</Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
