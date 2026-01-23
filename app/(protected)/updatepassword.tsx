import React from "react";
import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import UpdatePassword from "@/modules/profile/updatepassword";

export default function restpassword() {
  return (
    <ApSafeAreaView>
      <UpdatePassword />
    </ApSafeAreaView>
  );
}
