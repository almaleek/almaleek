import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  TextInput,
} from "react-native";
import * as Contacts from "expo-contacts";
import { CircleUser } from "lucide-react-native";

interface NetworkItem {
  name: string;
  image: any;
}

export default function NetworkPhonePicker({
  selectedNetwork,
  setSelectedNetwork,
  phone,
  setPhone,
  networks, // <<==== NEW PROP
}: {
  selectedNetwork: NetworkItem | null;
  setSelectedNetwork: (network: NetworkItem) => void;
  phone: string;
  setPhone: (phone: string) => void;
  networks: NetworkItem[]; // <<==== dynamic list
}) {
  const [networkModal, setNetworkModal] = useState(false);
  const [contactModal, setContactModal] = useState(false);
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);

  /* Load contacts */
  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });
        setContacts(data);
      }
    })();
  }, []);

  return (
    <>
      {/* MAIN INPUT CARD */}
      <View className="px-4 mt-4">
        <View className="flex-row items-center bg-gray-100 p-3 rounded-xl">
          {/* OPEN NETWORK SELECTOR */}
          <TouchableOpacity onPress={() => setNetworkModal(true)}>
            <Image
              source={
                selectedNetwork?.image || require("../../assets/images/mtn.png")
              }
              className="w-9 h-9 rounded-full"
            />
          </TouchableOpacity>

          {/* PHONE INPUT */}
          <TextInput
            className="ml-3 flex-1 text-lg font-medium"
            placeholder="Enter phone number"
            value={phone}
            onChangeText={(text) => setPhone(text)}
            keyboardType="numeric"
            maxLength={11}
          />

          {/* CONTACT PICKER */}
          <TouchableOpacity onPress={() => setContactModal(true)}>
            <CircleUser size={22} />
          </TouchableOpacity>
        </View>
      </View>

      {/* NETWORK SELECT MODAL */}
      <Modal visible={networkModal} transparent animationType="fade">
        <View className="flex-1 bg-black/40 justify-center items-center">
          <View className="bg-white w-80 p-4 rounded-2xl">
            <Text className="text-lg font-semibold mb-3">Select Network</Text>

            {networks.map((item: any, index: number) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setSelectedNetwork(item);
                  setNetworkModal(false);
                }}
                className="flex-row items-center p-3"
              >
                <Image source={item.image} className="w-9 h-9 rounded-full" />
                <Text className="ml-3 text-lg capitalize">{item.name}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              className="mt-3 p-2 bg-gray-200 rounded-xl"
              onPress={() => setNetworkModal(false)}
            >
              <Text className="text-center">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CONTACT PICKER MODAL */}
      <Modal visible={contactModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white max-h-[60%] p-4 rounded-t-3xl">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-semibold ">Select Contact</Text>

              <TouchableOpacity
                className=" p-2 bg-red-200 rounded-lg"
                onPress={() => setContactModal(false)}
              >
                <Text className="text-center">X</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={contacts}
              keyExtractor={(item) => item.id as any}
              renderItem={({ item }) => {
                const number = item?.phoneNumbers?.[0]?.number;
                if (!number) return null;

                return (
                  <TouchableOpacity
                    className="p-3 border-b border-gray-200"
                    onPress={() => {
                      setPhone(number.replace(/\s+/g, ""));
                      setContactModal(false);
                    }}
                  >
                    <Text className="text-base font-medium">{item?.name}</Text>
                    <Text className="text-gray-600">{number}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
