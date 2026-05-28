import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Share } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { db, collection, onSnapshot, query, where, updateDoc, doc, addDoc } from '../firebase';
import { Trip, Parcel } from '../types';
import { Truck, MapPin, Package, RefreshCw, Navigation, CheckCircle, Smartphone } from 'lucide-react-native';

export default function DriverDashboard() {
  const { user } = useAuth();
  const [assignedTrips, setAssignedTrips] = useState<Trip[]>([]);
  const [assignedParcels, setAssignedParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Trips assigned to this driver
  useEffect(() => {
    if (!user) return;

    const tripsQuery = query(
      collection(db, 'trips'),
      where('driverId', '==', user.uid)
    );

    const unsubTrips = onSnapshot(tripsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
      setAssignedTrips(data);
      setLoading(false);
    });

    return unsubTrips;
  }, [user]);

  // Load Parcels allocated to the active trips of this driver
  useEffect(() => {
    if (assignedTrips.length === 0) {
      setAssignedParcels([]);
      return;
    }

    const tripIds = assignedTrips.map(t => t.id);
    const unsubParcels = onSnapshot(collection(db, 'parcels'), (snapshot) => {
      const allParcels = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Parcel));
      const filtered = allParcels.filter(p => tripIds.includes(p.tripId));
      setAssignedParcels(filtered);
    });

    return unsubParcels;
  }, [assignedTrips]);

  const handleUpdateTripStatus = async (tripId: string, currentStatus: string) => {
    const nextStatuses: Record<string, 'active' | 'completed' | 'cancelled'> = {
      'scheduled': 'active',
      'active': 'completed',
    };

    const next = nextStatuses[currentStatus];
    if (!next) {
      Alert.alert('تنبيه', 'تم بالفعل إكمال هذه الرحلة بنجاح ولا يمكن تعديل حالتها.');
      return;
    }

    try {
      await updateDoc(doc(db, 'trips', tripId), { status: next });
      Alert.alert('تم التحديث', `تم بنجاح تغيير حالة الرحلة إلى: ${next === 'active' ? 'جارية ومحركة' : 'مكتملة ومسلمة'}`);
    } catch (err) {
      Alert.alert('خطأ', 'فشل في تحديث حالة الرحلة.');
    }
  };

  const handleUpdateParcelStatus = async (parcelId: string, currentStatus: string) => {
    const nextStatuses: Record<string, 'shipped' | 'delivered'> = {
      'pending': 'shipped',
      'shipped': 'delivered'
    };

    const next = nextStatuses[currentStatus];
    if (!next) {
      Alert.alert('تنبيه', 'تم تسليم هذا الطرد بالفعل للمستلم النهائي.');
      return;
    }

    try {
      await updateDoc(doc(db, 'parcels', parcelId), { status: next });
      Alert.alert('تم التحديث', `تم تعديل حالة شحنة بوليصة الشحن إلى: ${next === 'shipped' ? 'قيد الشحن' : 'تم التسليم بنجاح'}`);
    } catch (err) {
      Alert.alert('خطأ', 'فشل تحديث حالة الطرد.');
    }
  };

  const handleMockLiveLocationShare = async (tripId: string) => {
    // Simulated Driver Coordinate updater creating a Live location document inside Firestore for real-time customer views
    try {
      const liveRef = collection(db, 'liveLocations');
      const qLocation = query(liveRef, where('tripId', '==', tripId));
      
      const newCoords = {
        driverId: user?.uid || 'driver',
        tripId: tripId,
        // Mocking coordinates along a safe route for testing (Damascus to Riyadh/Amman/etc.)
        lat: 33.5138 + (Math.random() - 0.5) * 0.1,
        lng: 36.2765 + (Math.random() - 0.5) * 0.1,
        lastUpdated: new Date().toISOString()
      };

      await addDoc(liveRef, newCoords);
      Alert.alert(
        'بث الموقع المباشر',
        'تم بث إحداثيات موقع الحافلة الجغرافي (GPS) بنجاح ليتمكن المسافرون ومرسلو الطرود من تتبعك بشكل مباشر وآمن.'
      );
    } catch (e) {
      Alert.alert('خطأ', 'فشل تفعيل بث الـ GPS.');
    }
  };

  return (
    <ScrollView className="flex-1 bg-stone-50" contentContainerStyle={{ paddingVertical: 24, paddingHorizontal: 24 }}>
      <View className="bg-emerald-600 p-5 rounded-3xl flex-row justify-between items-center mb-6">
        <View className="items-start">
          <Text className="text-emerald-100 text-[10px]">مستوى الكفاءة</Text>
          <Text className="text-white font-extrabold text-sm">ممتاز 🎖️</Text>
        </View>
        <View className="items-end">
          <Text className="text-emerald-100 text-[10px]">لوحة السائق الحاصة بك</Text>
          <Text className="text-white font-extrabold text-lg">بوابة القيادة الذكية</Text>
        </View>
      </View>

      {/* Trips assigned */}
      <View className="mb-6">
        <Text className="text-right text-stone-800 font-extrabold text-base mb-4 pr-1">رحلاتك المجدولة اليوم</Text>
        
        {loading ? (
          <ActivityIndicator color="#10b981" />
        ) : assignedTrips.length === 0 ? (
          <Text className="text-center text-stone-400 py-6">ليس لديك أي رحلات مسندة حالياً.</Text>
        ) : (
          <View className="space-y-3">
            {assignedTrips.map((trip) => (
              <View key={trip.id} className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm space-y-4">
                <View className="flex-row items-center justify-between border-b border-stone-150 pb-2.5">
                  <View className={`px-2.5 py-1 rounded-full ${
                    trip.status === 'active' ? 'bg-emerald-50' : 'bg-amber-50'
                  }`}>
                    <Text className={`font-extrabold text-[10px] ${
                      trip.status === 'active' ? 'text-emerald-700' : 'text-amber-700'
                    }`}>
                      {trip.status === 'active' ? 'جارية حالياً' : 'مجدولة'}
                    </Text>
                  </View>
                  <Text className="text-stone-800 font-extrabold text-sm">{trip.from} ➔ {trip.to}</Text>
                </View>

                {/* Tracking location trigger */}
                <View className="flex-row justify-between pt-1">
                  <TouchableOpacity
                    onPress={() => handleMockLiveLocationShare(trip.id)}
                    className="flex-row items-center bg-stone-950 px-4 py-2.5 rounded-xl border border-stone-800"
                  >
                    <Navigation color="#10b981" size={14} />
                    <Text className="text-white font-extrabold text-[10px] ml-1.5">بث تتبع الموقع مباشر</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleUpdateTripStatus(trip.id, trip.status)}
                    className="flex-row items-center bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100"
                  >
                    <RefreshCw color="#059669" size={14} />
                    <Text className="text-emerald-700 font-extrabold text-[10px] ml-1.5">تحديث حالة الرحلة</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Parcels assigned */}
      <View className="mb-6">
        <Text className="text-right text-stone-800 font-extrabold text-base mb-4 pr-1">شحنات وطرود الرحلات لتسليمها</Text>
        
        {loading ? (
          <ActivityIndicator color="#10b981" />
        ) : assignedParcels.length === 0 ? (
          <Text className="text-center text-stone-400 py-6">لا يوجد بضائع مسندة لتسليمها.</Text>
        ) : (
          <View className="space-y-3">
            {assignedParcels.map((parcel) => (
              <View key={parcel.id} className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm space-y-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-emerald-700 font-mono font-extrabold text-xs">{parcel.waybillNumber}</Text>
                  <Text className="text-stone-800 font-extrabold text-sm">{parcel.receiverName}</Text>
                </View>

                <View className="flex-row justify-between pt-1">
                  <TouchableOpacity
                    onPress={() => handleUpdateParcelStatus(parcel.id, parcel.status)}
                    className="bg-emerald-600/10 border border-emerald-500/10 px-4 py-2 rounded-xl items-center justify-center flex-row flex-1"
                  >
                    <CheckCircle color="#059669" size={14} />
                    <Text className="text-emerald-800 font-extrabold text-xs ml-2">
                      {parcel.status === 'pending' ? 'بدء الشحن (شُحنت)' : parcel.status === 'shipped' ? 'تأكيد التسليم النهائي' : 'تم تسليمها'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
