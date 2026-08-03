import React, { useState } from 'react';
import { 
  Text, 
  View, 
  TouchableOpacity, 
  Switch, 
  ScrollView, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  ArrowLeft, 
  User, 
  Bell, 
  Lock, 
  Moon, 
  Sun,
  Shield, 
  HelpCircle, 
  FileText, 
  LogOut, 
  ChevronRight 
} from 'lucide-react-native';

export default function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { theme, themeMode, updateThemeMode } = useTheme();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [dmNotifications, setDmNotifications] = useState(true);

  const isDark = themeMode === 'dark' || (themeMode === 'system' && theme.dark);

  const toggleTheme = (val) => {
    updateThemeMode(val ? 'dark' : 'light');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3.5 bg-card border-b border-border">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <ArrowLeft size={22} className="text-foreground" color={theme.colors.foreground} />
        </TouchableOpacity>
        <Text className="text-lg font-extrabold text-foreground">App Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* User Card Summary */}
        <View className="flex-row items-center bg-card rounded-xl p-4 mb-5 border border-border">
          <View className="w-12 h-12 rounded-full bg-primary items-center justify-center mr-3.5">
            <Text className="text-primary-foreground text-xl font-extrabold">{(user?.full_name || 'U').charAt(0).toUpperCase()}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-foreground">{user?.full_name || 'Trader Member'}</Text>
            <Text className="text-sm text-muted-foreground mt-0.5">{user?.email}</Text>
          </View>
        </View>

        {/* Section 1: Preferences & Account */}
        <Text className="text-[11px] font-extrabold text-muted-foreground tracking-widest mb-2 mt-2.5 ml-1">ACCOUNT & PROFILE</Text>
        <View className="bg-card rounded-md border border-border overflow-hidden mb-4">
          <TouchableOpacity className="flex-row items-center px-4 py-3.5" activeOpacity={0.7} onPress={() => navigation.navigate('ProfileTab')}>
            <User size={20} className="mr-3" color={theme.colors.primary} />
            <Text className="flex-1 text-[15px] font-semibold text-foreground">Edit Profile & Bio</Text>
            <ChevronRight size={18} color={theme.colors.mutedForeground} />
          </TouchableOpacity>

          <View className="h-px bg-border ml-12" />

          <TouchableOpacity className="flex-row items-center px-4 py-3.5" activeOpacity={0.7} onPress={() => Alert.alert('Security', 'Password reset instructions sent to ' + user?.email)}>
            <Lock size={20} className="mr-3" color={theme.colors.primary} />
            <Text className="flex-1 text-[15px] font-semibold text-foreground">Change Password & Security</Text>
            <ChevronRight size={18} color={theme.colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Section 2: Messenger Notifications */}
        <Text className="text-[11px] font-extrabold text-muted-foreground tracking-widest mb-2 mt-2.5 ml-1">NOTIFICATIONS & ALERTS</Text>
        <View className="bg-card rounded-md border border-border overflow-hidden mb-4">
          <View className="flex-row items-center justify-between px-4 py-3">
            <View className="flex-row items-center">
              <Bell size={20} className="mr-3 text-amber-500" color="#f59e0b" />
              <Text className="flex-1 text-[15px] font-semibold text-foreground">Push Notifications</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View className="h-px bg-border ml-12" />

          <View className="flex-row items-center justify-between px-4 py-3">
            <View className="flex-row items-center">
              <Bell size={20} className="mr-3 text-amber-500" color="#f59e0b" />
              <Text className="flex-1 text-[15px] font-semibold text-foreground">Direct Message Alerts</Text>
            </View>
            <Switch
              value={dmNotifications}
              onValueChange={setDmNotifications}
              trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Section 3: Appearance */}
        <Text className="text-[11px] font-extrabold text-muted-foreground tracking-widest mb-2 mt-2.5 ml-1">APPEARANCE</Text>
        <View className="bg-card rounded-md border border-border overflow-hidden mb-4">
          <View className="flex-row items-center justify-between px-4 py-3">
            <View className="flex-row items-center">
              {isDark ? (
                <Moon size={20} className="mr-3 text-cyan-500" color="#06b6d4" />
              ) : (
                <Sun size={20} className="mr-3 text-cyan-500" color="#06b6d4" />
              )}
              <Text className="flex-1 text-[15px] font-semibold text-foreground">Dark Theme</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Section 4: Support & Legal */}
        <Text className="text-[11px] font-extrabold text-muted-foreground tracking-widest mb-2 mt-2.5 ml-1">SUPPORT & ABOUT</Text>
        <View className="bg-card rounded-md border border-border overflow-hidden mb-4">
          <TouchableOpacity className="flex-row items-center px-4 py-3.5" activeOpacity={0.7}>
            <HelpCircle size={20} className="mr-3 text-emerald-500" color="#10b981" />
            <Text className="flex-1 text-[15px] font-semibold text-foreground">Help Center & FAQ</Text>
            <ChevronRight size={18} color={theme.colors.mutedForeground} />
          </TouchableOpacity>

          <View className="h-px bg-border ml-12" />

          <TouchableOpacity className="flex-row items-center px-4 py-3.5" activeOpacity={0.7}>
            <FileText size={20} className="mr-3 text-emerald-500" color="#10b981" />
            <Text className="flex-1 text-[15px] font-semibold text-foreground">Terms of Service & Privacy Policy</Text>
            <ChevronRight size={18} color={theme.colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Section 5: Log Out */}
        <TouchableOpacity className="flex-row items-center justify-center bg-destructive/10 rounded-md py-3.5 border border-destructive/30 mt-3 mb-8" onPress={logout} activeOpacity={0.8}>
          <LogOut size={20} className="mr-3" color={theme.colors.error} />
          <Text className="text-[15px] font-bold text-destructive">Sign Out of Investraders</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
