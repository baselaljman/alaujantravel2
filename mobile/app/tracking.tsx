import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { db, collection, getDocs, query, where } from '../firebase';
import { Parcel } from '../types';
import { Search, Package, MapPin, Truck, CheckCircle, ArrowLeft, Plus } from 'lucide-react-native';

export default function TrackingScreen() {
  const [waybillNum, setWaybillNum] = useState('');
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearchTracking = async () => {
    if (!waybillNum.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم الشحنة أو بوليصة الشحن للمتابعة');
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      // Look up parcel matching code in Firestore
      const q = query(
        collection(db, 'parcels'),
        where('waybillNumber', '==', waybillNum.trim())
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setParcel(null);
      } else {
        const found = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Parcel;
        setParcel(found);
      }
    } catch (err: any) {
      Alert.alert('خطأ', 'فشل البحث عن الشحنة نتيجة مشكلة في الاتصال بالشبكة.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Status mapping matching tracking timeline step statuses
  const getStatusStep = (status: string): number => {
    switch (status) {
      case 'pending': return 1;
      case 'shipped': return 2;
      case 'delivered': return 3;
      default: return 1;
    }
  };

  return (
    <ScrollView className="flex-1 bg-stone-50" contentContainerStyle={{ paddingVertical: 24, paddingHorizontal: 24 }}>
      <View className="items-center mb-6">
        <View className="h-14 w-14 bg-stone-900 rounded-2xl items-center justify-center mb-3 shadow-md">
          <Package color="#10b981" size={24} />
        </View>
        <Text className="text-stone-900 font-extrabold text-xl text-center mb-1">تتبع مسار شحنتك المباشر</Text>
        <Text className="text-stone-500 text-xs text-center px-4 leading-5">أدخل رقم بوليصة الشحن (Waybill) الذي استلمته من موظف الفرع لمعرفة تفاصيل رحلة وحالة شحنتك فوراً.</Text>
      </View>

      {/* Search Bar Input Container */}
      <View className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm flex-row items-center space-x-2 mb-6">
        <TouchableOpacity 
          onPress={handleSearchTracking}
          disabled={loading}
          className="bg-stone-900 h-11 px-6 rounded-xl items-center justify-center"
        >
          {loading ? <ActivityIndicator color="#10b981" size="small" /> : <Text className="text-white font-extrabold text-xs">تتبع</Text>}
        </TouchableOpacity>
        
        <TextInput
          value={waybillNum}
          onChangeText={setWaybillNum}
          placeholder="مثال: OUT-91823"
          placeholderTextColor="#a8a29e"
          autoCapitalize="characters"
          className="flex-1 text-right font-mono font-bold text-stone-800 text-sm h-11"
        />
      </View>

      {/* Results details panel */}
      {searched && !loading && (
        parcel ? (
          <View className="space-y-6">
            {/* Status Step Guide Progress Indicator */}
            <View className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
              <Text className="text-right text-stone-800 font-extrabold text-sm mb-4">حالة الشحنة الحالية</Text>
              
              <View className="flex-row justify-between items-center relative py-6">
                {/* Visual Connector Line */}
                <View className="absolute top-[38px] left-4 right-4 h-1 bg-stone-100 -z-10" />
                <View 
                  className="absolute top-[38px] right-4 h-1 bg-emerald-600 -z-10" 
                  style={{ 
                    left: getStatusStep(parcel.status) === 3 ? 16 : getStatusStep(parcel.status) === 2 ? '50%' : '100%' 
                  }} 
                />

                {/* Step 3 */}
                <View className="items-center w-[30%]">
                  <View className={`h-9 w-9 rounded-full items-center justify-center mb-2 ${
                    getStatusStep(parcel.status) >= 3 ? 'bg-emerald-600 border-emerald-700' : 'bg-white border-2 border-stone-200'
                  }`}>
                    <CheckCircle color={getStatusStep(parcel.status) >= 3 ? '#fff' : '#a8a29e'} size={16} />
                  </View>
                  <Text className={`font-extrabold text-[10px] text-center ${getStatusStep(parcel.status) >= 3 ? 'text-stone-800' : 'text-stone-400'}`}>تم التسليم</Text>
                </View>

                {/* Step 2 */}
                <View className="items-center w-[30%]">
                  <View className={`h-9 w-9 rounded-full items-center justify-center mb-2 ${
                    getStatusStep(parcel.status) >= 2 ? 'bg-emerald-600 border-emerald-700' : 'bg-white border-2 border-stone-200'
                  }`}>
                    <Truck color={getStatusStep(parcel.status) >= 2 ? '#fff' : '#a8a29e'} size={16} />
                  </View>
                  <Text className={`font-extrabold text-[10px] text-center ${getStatusStep(parcel.status) >= 2 ? 'text-stone-800' : 'text-stone-400'}`}>قيد الشحن</Text>
                </View>

                {/* Step 1 */}
                <View className="items-center w-[30%]">
                  <View className={`h-9 w-9 rounded-full items-center justify-center mb-2 ${
                    getStatusStep(parcel.status) >= 1 ? 'bg-emerald-600 border-emerald-700' : 'bg-white border-2 border-stone-200'
                  }`}>
                    <Package color={getStatusStep(parcel.status) >= 1 ? '#fff' : '#a8a29e'} size={16} />
                  </View>
                  <Text className={`font-extrabold text-[10px] text-center ${getStatusStep(parcel.status) >= 1 ? 'text-stone-800' : 'text-stone-400'}`}>تم الاستلام</Text>
                </View>
              </View>
            </View>

            {/* Information Card Details */}
            <View className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4">
              <View className="flex-row items-center justify-between border-b border-stone-100 pb-3">
                <Text className="text-emerald-700 font-mono font-extrabold text-sm">{parcel.waybillNumber}</Text>
                <Text className="text-stone-800 font-extrabold text-sm">تفاصيل الشحنة</Text>
              </View>

              <View className="flex-row justify-between py-1">
                <View className="items-start w-1/2">
                  <Text className="text-stone-400 text-[10px]">المرسل إليه (المستلم)</Text>
                  <Text className="text-stone-800 font-bold text-xs">{parcel.receiverName}</Text>
                  <Text className="text-stone-400 text-[9px] font-mono mt-0.5">{parcel.receiverPhone}</Text>
                </View>

                <View className="items-end w-1/2">
                  <Text className="text-stone-400 text-[10px]">المرسل (المصدر)</Text>
                  <Text className="text-stone-800 font-bold text-xs">{parcel.senderName}</Text>
                  <Text className="text-stone-400 text-[9px] font-mono mt-0.5">{parcel.senderPhone}</Text>
                </View>
              </View>

              <View className="flex-row justify-between border-t border-stone-50 pt-3">
                <View className="items-start">
                  <Text className="text-stone-400 text-[10px]">تكلفة الشحن لتدفعه</Text>
                  <Text className="text-emerald-700 font-extrabold text-sm">{parcel.price} {parcel.currency}</Text>
                </View>

                <View className="items-end">
                  <Text className="text-stone-400 text-[10px]">مسار خط السير</Text>
                  <Text className="text-stone-800 font-bold text-xs">{parcel.from} ➔ {parcel.to}</Text>
                </View>
              </View>

              {parcel.note ? (
                <View className="bg-stone-50 p-3 rounded-xl border border-stone-100 mt-2">
                  <Text className="text-stone-400 text-[9px] text-right mb-0.5">ملاحظات الشحنة</Text>
                  <Text className="text-stone-700 text-xs text-right leading-5">{parcel.note}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : (
          <View className="bg-stone-100/60 rounded-3xl p-8 items-center justify-center border border-stone-200 border-dashed">
            <Package color="#a8a29e" size={32} />
            <Text className="text-stone-500 font-bold text-sm text-center mt-3">لم يتم العثور على أي شحنة مسجلة برقم بوليصة الشحن المدخل.</Text>
            <Text className="text-stone-400 text-[10px] text-center mt-1">الرجاء التحقق من كود الشحنة والاتصال بإدارة الفرع لتأكيد تفعيل بوليصة الشحن.</Text>
          </View>
        )
      )}
    </ScrollView>
  );
}
