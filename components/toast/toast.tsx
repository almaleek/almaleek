import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "#22c55e" }}
      text1Style={{ fontSize: 16, fontWeight: "600" }}
      text2Style={{ fontSize: 13 }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: "#ef4444" }}
      text1Style={{ fontSize: 16, fontWeight: "600" }}
      text2Style={{ fontSize: 13 }}
    />
  ),
};

export default toastConfig;
