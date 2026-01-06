import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { supabase } from "../../src/lib/supabase";

export default function HomeScreen() {
  const [status, setStatus] = useState("Checking Supabase...");
  const [loading, setLoading] = useState(true);

  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const canSubmit = useMemo(() => email.trim().length > 3 && password.length >= 6, [email, password]);

  async function refreshSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setStatus("Supabase error: " + error.message);
        setSessionEmail(null);
      } else {
        const e = data.session?.user?.email ?? null;
        setSessionEmail(e);
        setStatus(e ? "Connected ✅ (session)" : "Connected ✅ (no session)");
      }
    } catch (e: any) {
      setStatus("Supabase error: " + String(e?.message ?? e));
      setSessionEmail(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!mounted) return;
      await refreshSession();
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      // When you sign in/out, update UI
      refreshSession();
    });

    return () => {
      mounted = false;
      sub.subscription?.unsubscribe();
    };
  }, []);

  async function signIn() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) Alert.alert("Sign in failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function signUp() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) Alert.alert("Sign up failed", error.message);
      else Alert.alert("Sign up", "Check your email if confirmation is enabled.");
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) Alert.alert("Sign out failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#000" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
        <Text style={{ fontSize: 28, fontWeight: "800", marginBottom: 10, color: "#fff" }}>
          Whistle Mobile
        </Text>

        <Text style={{ fontSize: 16, color: "#fff", opacity: 0.9, marginBottom: 18 }}>
          {status}
        </Text>

        {loading ? (
          <View style={{ paddingVertical: 8 }}>
            <ActivityIndicator />
          </View>
        ) : null}

        {sessionEmail ? (
          <>
            <Text style={{ color: "#fff", marginBottom: 14 }}>
              Signed in as: <Text style={{ fontWeight: "700" }}>{sessionEmail}</Text>
            </Text>

            <Pressable
              onPress={signOut}
              style={{
                marginTop: 8,
                padding: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#fff",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>Sign out</Text>
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#888"
              autoCapitalize="none"
              keyboardType="email-address"
              style={{
                color: "#fff",
                borderWidth: 1,
                borderColor: "#333",
                borderRadius: 12,
                padding: 12,
                marginBottom: 10,
              }}
            />

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password (min 6 chars)"
              placeholderTextColor="#888"
              secureTextEntry
              style={{
                color: "#fff",
                borderWidth: 1,
                borderColor: "#333",
                borderRadius: 12,
                padding: 12,
                marginBottom: 14,
              }}
            />

            <Pressable
              disabled={!canSubmit}
              onPress={signIn}
              style={{
                padding: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: canSubmit ? "#fff" : "#333",
                opacity: canSubmit ? 1 : 0.5,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>Sign in</Text>
            </Pressable>

            <Pressable
              disabled={!canSubmit}
              onPress={signUp}
              style={{
                padding: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: canSubmit ? "#fff" : "#333",
                opacity: canSubmit ? 1 : 0.5,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>Sign up</Text>
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
