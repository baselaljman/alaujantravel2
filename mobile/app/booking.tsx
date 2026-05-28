import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { db, collection, onSnapshot, query, where, addDoc, doc, updateDoc, getDoc } from '../firebase';
import { City, Trip, Booking } from '../types';
import { Calendar, Users, MapPin, Search, ArrowLeft, ArrowUpRight, Shield } from 'lucide-react-native';

export default function BookingScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [cities, setCities] = useState<City[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // Search Param State
  const [tripType, setTripType] = useState<'international' | 'umrah'>('international');
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [tripDate, setTripDate] = useState('');

  // Selected Trip & Booking Flow state
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Search, 2: Seat Selection, 3: Form

  // Load cities list
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'cities'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as City));
      setCities(data);
      if (data.length > 0) {
        setFromCity(data[0].name);
        const secondOption = data.find(c => c.country !== data[0].country);
        if (secondOption) setToCity(secondOption.name);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Filter available destination cities based on tripType
  const originCityObj = cities.find(c => c.name === fromCity);
  const filteredToCities = originCityObj
    ? (tripType === 'umrah'
        ? cities.filter(c => c.name !== fromCity)
        : cities.filter(c => c.country !== originCityObj.country))
    : cities;

  const navigateToSeatSelection = (trip: Trip) => {
    setSelectedTrip(trip);
    setStep(2);
  };

  const handleSearchTrips = () => {
    setLoading(true);
    const tripsQuery = query(
      collection(db, 'trips'),
      where('from', '==', fromCity),
      where('to', '==', toCity),
      where('status', '==', 'active')
    );

    const unsub = onSnapshot(tripsQuery, (snapshot) => {
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
      if (tripDate) {
        data = data.filter(t => t.date === tripDate);
      }
      setTrips(data);
      setLoading(false);
    });
  };

  const handleConfirmSeat = () => {
    if (selectedSeat === null) {
      Alert.alert('من فضلك', 'يرجى تحديد المقعد الذي ترغب في حجزه');
      return;
    }
    setStep(3);
  };

  const handleSubmitBooking = async () => {
    if (!passengerName || !passengerPhone) {
      Alert.alert('تنبيه', 'من فضلك املأ حقل الاسم ورقم الهاتف للمسافر');
      return;
    }
    if (!selectedTrip) return;

    setLoading(true);
    try {
      const dbTripRef = doc(db, 'trips', selectedTrip.id);
      const tripDoc = await getDoc(dbTripRef);
      if (!tripDoc.exists()) {
        throw new Error('الرحلة المطلوبة لم تعد متاحة');
      }

      const tripData = tripDoc.data() as Trip;
      const bookedSeats = tripData.bookedSeats || [];

      if (selectedSeat !== null && bookedSeats.includes(selectedSeat)) {
        Alert.alert('عذراً', 'هذا المقعد محجوز بالفعل من قبل مسافر آخر، يرجى اختيار مقعد آخر.');
        setStep(2);
        return;
      }

      // Add Booking Document
      const newBooking: Omit<Booking, 'id'> = {
        tripId: selectedTrip.id,
        userId: user?.uid || 'guest',
        seatNumber: selectedSeat!,
        passengerName,
        passengerPhone,
        passengerEmail: user?.email || '',
        passportNumber,
        paymentMethod: 'later',
        bookingDate: new Date().toISOString(),
        status: 'confirmed',
        from: selectedTrip.from,
        to: selectedTrip.to
      };

      await addDoc(collection(db, 'bookings'), newBooking);

      // Update Trip available state
      await updateDoc(dbTripRef, {
        bookedSeats: [...bookedSeats, selectedSeat!],
        availableSeats: Math.max(0, (tripData.availableSeats || 0) - 1)
      });

      Alert.alert(
        'تم الحجز بنجاح',
        `لقد تم تسجيل حجز المقعد رقم (${selectedSeat}) وتأكيد حجزك للرحلة المتوجهة إلى ${selectedTrip.to} بنجاح.`,
        [
          { 
            text: 'رائع', 
            onPress: () => {
              router.replace('/home');
            } 
          }
        ]
      );
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'حدث خطأ أثناء إجراء الحجز');
    } finally {
      setLoading(false);
    }
  };

  // Generate Seat Grid
  const renderSeatGrid = () => {
    if (!selectedTrip) return null;
    const capacity = selectedTrip.totalSeats || 50;
    const booked = selectedTrip.bookedSeats || [];
    const seats = Array.from({ length: capacity }, (_, i) => i + 1);

    return (
      <View className="flex-row flex-wrap justify-between">
        {seats.map((seatNum) => {
          const isBooked = booked.includes(seatNum);
          const isSelected = selectedSeat === seatNum;

          return (
            <TouchableOpacity
              key={seatNum}
              disabled={isBooked}
              onPress={() => setSelectedSeat(seatNum)}
              className={`w-[22%] h-12 rounded-xl items-center justify-center mb-3 border ${
                isBooked 
                  ? 'bg-stone-100 border-stone-200 opacity-60' 
                  : isSelected 
                    ? 'bg-emerald-600 border-emerald-700' 
                    : 'bg-white border-stone-200'
              }`}
            >
              <Text className={`font-extrabold text-sm ${
                isBooked 
                  ? 'text-stone-400 font-normal line-through' 
                  : isSelected 
                    ? 'text-white' 
                    : 'text-stone-700'
              }`}>
                {seatNum}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-stone-50">
      {/* Search Header state tabs */}
      {step === 1 && (
        <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Trip toggle */}
          <View className="flex-row justify-between bg-stone-200/50 p-1.5 rounded-2xl mb-6">
            <TouchableOpacity
              onPress={() => setTripType('umrah')}
              className={`w-1/2 py-3 rounded-xl items-center ${tripType === 'umrah' ? 'bg-emerald-600' : ''}`}
            >
              <Text className={`font-extrabold text-sm ${tripType === 'umrah' ? 'text-white' : 'text-stone-600'}`}>رحلات العمرة</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTripType('international')}
              className={`w-1/2 py-3 rounded-xl items-center ${tripType === 'international' ? 'bg-emerald-600' : ''}`}
            >
              <Text className={`font-extrabold text-sm ${tripType === 'international' ? 'text-white' : 'text-stone-600'}`}>رحلات دولية</Text>
            </TouchableOpacity>
          </View>

          {/* Search Inputs Card */}
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-4">
            {/* From City */}
            <View className="space-y-1">
              <Text className="text-right text-stone-700 font-bold text-xs pr-1">مدينة الانطلاق</Text>
              <View className="border border-stone-200 bg-stone-50 rounded-xl px-3 h-12 justify-center">
                <TextInput
                  value={fromCity}
                  onChangeText={setFromCity}
                  placeholder="أدخل مدينة المغادرة"
                  placeholderTextColor="#a8a29e"
                  className="text-right font-bold text-stone-800 text-sm"
                />
              </View>
            </View>

            {/* To City */}
            <View className="space-y-1">
              <Text className="text-right text-stone-700 font-bold text-xs pr-1">وجهة الوصول</Text>
              <View className="border border-stone-200 bg-stone-50 rounded-xl px-3 h-12 justify-center">
                <TextInput
                  value={toCity}
                  onChangeText={setToCity}
                  placeholder="أدخل وجهة الوصول"
                  placeholderTextColor="#a8a29e"
                  className="text-right font-bold text-stone-800 text-sm"
                />
              </View>
            </View>

            {/* Date */}
            <View className="space-y-1">
              <Text className="text-right text-stone-700 font-bold text-xs pr-1">تاريخ السفر (اختياري)</Text>
              <View className="border border-stone-200 bg-stone-50 rounded-xl px-3 h-12 justify-center">
                <TextInput
                  value={tripDate}
                  onChangeText={setTripDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#a8a29e"
                  className="text-right font-bold text-stone-800 text-sm"
                />
              </View>
            </View>

            {/* Show Results Button */}
            <TouchableOpacity
              onPress={handleSearchTrips}
              className="bg-emerald-600 h-12 rounded-xl items-center justify-center flex-row shadow-lg shadow-emerald-100"
            >
              <Search color="#fff" size={18} />
              <Text className="text-white font-extrabold text-base ml-2">ابحث عن الرحلات</Text>
            </TouchableOpacity>
          </View>

          {/* Match results list */}
          <View className="mt-8">
            <Text className="text-right text-stone-800 font-extrabold text-base mb-4">الرحلات المتاحة</Text>
            {loading ? (
              <ActivityIndicator size="small" color="#10b981" />
            ) : trips.length === 0 ? (
              <Text className="text-center text-stone-400 font-bold py-6">اضغط على زر البحث لعرض الرحلات المجدولة.</Text>
            ) : (
              <View className="space-y-3">
                {trips.map((item) => (
                  <View key={item.id} className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm space-y-4">
                    <View className="flex-row items-center justify-between">
                      <View className="bg-emerald-50 px-3 py-1 rounded-full">
                        <Text className="text-emerald-700 font-extrabold text-xs">{item.busType}</Text>
                      </View>
                      <Text className="text-stone-800 font-extrabold text-sm">{item.from} إلى {item.to}</Text>
                    </View>

                    <View className="flex-row justify-between bg-stone-50 rounded-2xl p-3">
                      <View className="items-start">
                        <Text className="text-stone-400 text-[10px]">السعر (ليرة سورية)</Text>
                        <Text className="text-stone-700 font-bold text-xs">{item.priceSYP} ل.س</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-stone-400 text-[10px]">السعر (ريال سعودي)</Text>
                        <Text className="text-emerald-700 font-extrabold text-sm">{item.priceSAR} ر.س</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => navigateToSeatSelection(item)}
                      className="bg-stone-900 py-3 rounded-xl items-center justify-center flex-row"
                    >
                      <Text className="text-white font-extrabold text-xs mr-2">احجز مقعدك الآن</Text>
                      <ArrowUpRight color="#10b981" size={16} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Step 2: Seat Selection Grid */}
      {step === 2 && selectedTrip && (
        <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="flex-row items-center justify-between border-b border-stone-200 pb-4 mb-4">
            <TouchableOpacity onPress={() => setStep(1)} className="bg-stone-100 p-2 rounded-xl">
              <ArrowLeft color="#78716c" size={18} />
            </TouchableOpacity>
            <Text className="text-stone-800 font-extrabold text-base">اختر مقعدك لرحلة {selectedTrip.to}</Text>
          </View>

          {/* Map layout overview info */}
          <View className="flex-row justify-between mb-6 bg-stone-100 p-3 rounded-xl">
            <View className="flex-row items-center space-x-1">
              <View className="w-3.5 h-3.5 bg-emerald-600 rounded-md mr-1" />
              <Text className="text-stone-600 text-[10px] ml-1">محدد</Text>
            </View>
            <View className="flex-row items-center space-x-1">
              <View className="w-3.5 h-3.5 bg-stone-200 rounded-md mr-1" />
              <Text className="text-stone-600 text-[10px] ml-1">محجوز</Text>
            </View>
            <View className="flex-row items-center space-x-1">
              <View className="w-3.5 h-3.5 bg-white border border-stone-200 rounded-md mr-1" />
              <Text className="text-stone-600 text-[10px] ml-1">متاح</Text>
            </View>
          </View>

          {/* Driver seat marker */}
          <View className="items-start mb-4 pr-4">
            <View className="bg-stone-200 px-4 py-2 rounded-xl border border-stone-300">
              <Text className="text-stone-600 font-bold text-xs text-center font-mono">سائق الحافلة 🚌</Text>
            </View>
          </View>

          {renderSeatGrid()}

          <TouchableOpacity
            onPress={handleConfirmSeat}
            className="bg-emerald-600 h-12 rounded-xl items-center justify-center mt-6 shadow-lg shadow-emerald-200"
          >
            <Text className="text-white font-extrabold text-base">تأكيد حجز المقعد</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Step 3: Passenger info details form */}
      {step === 3 && selectedTrip && (
        <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="flex-row items-center justify-between border-b border-stone-200 pb-4 mb-6">
            <TouchableOpacity onPress={() => setStep(2)} className="bg-stone-100 p-2 rounded-xl">
              <ArrowLeft color="#78716c" size={18} />
            </TouchableOpacity>
            <Text className="text-stone-800 font-extrabold text-base">بيانات المسافر والمقعد {selectedSeat}</Text>
          </View>

          <View className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-4">
            <View className="bg-stone-50 border border-stone-100 p-4 rounded-2xl flex-row justify-between items-center mb-2">
              <View className="items-end">
                <Text className="text-emerald-700 font-extrabold text-sm">{selectedTrip.from} إلى {selectedTrip.to}</Text>
                <Text className="text-stone-500 text-[10px] mt-1">المقعد المحدد: <Text className="font-extrabold">{selectedSeat}</Text></Text>
              </View>
              <Users color="#059669" size={24} />
            </View>

            {/* Passenger Name */}
            <View className="space-y-1">
              <Text className="text-right text-stone-700 font-bold text-xs pr-1">اسم المسافر الكامل</Text>
              <View className="border border-stone-200 bg-stone-50 rounded-xl px-3 h-12 justify-center">
                <TextInput
                  value={passengerName}
                  onChangeText={setPassengerName}
                  placeholder="الرجاء كتابة اسم المسافر كما في الهوية"
                  placeholderTextColor="#a8a29e"
                  className="text-right font-bold text-stone-800 text-sm"
                />
              </View>
            </View>

            {/* Passenger Phone */}
            <View className="space-y-1">
              <Text className="text-right text-stone-700 font-bold text-xs pr-1">رقم الهاتف</Text>
              <View className="border border-stone-200 bg-stone-50 rounded-xl px-3 h-12 justify-center">
                <TextInput
                  value={passengerPhone}
                  onChangeText={setPassengerPhone}
                  placeholder="مثال: +9665xxxxxxxx"
                  placeholderTextColor="#a8a29e"
                  keyboardType="phone-pad"
                  className="text-right font-bold text-stone-800 text-sm"
                />
              </View>
            </View>

            {/* Passport */}
            <View className="space-y-1">
              <Text className="text-right text-stone-700 font-bold text-xs pr-1">رقم جواز السفر (اختياري)</Text>
              <View className="border border-stone-200 bg-stone-50 rounded-xl px-3 h-12 justify-center">
                <TextInput
                  value={passportNumber}
                  onChangeText={setPassportNumber}
                  placeholder="رقم جواز السفر للرحلات الدولية"
                  placeholderTextColor="#a8a29e"
                  className="text-right font-bold text-stone-800 text-sm"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSubmitBooking}
              disabled={loading}
              className="bg-emerald-600 h-12 rounded-xl items-center justify-center mt-6 shadow-lg shadow-emerald-200 flex-row"
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-extrabold text-base">احجز وأكد المقعد الآن</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
