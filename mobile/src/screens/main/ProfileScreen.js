import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { theme } from '../../theme/theme';
import { 
  LogOut, 
  User, 
  Award, 
  Shield, 
  Mail, 
  Calendar, 
  Settings, 
  MapPin, 
  Users, 
  Bell 
} from 'lucide-react-native';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      // Query profiles table matching web database
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (prof) setProfileData(prof);

      // Query connections count
      const { data: conns } = await supabase
        .from('Connection')
        .select('*')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .eq('status', 'accepted');

      setConnectionsCount(conns?.length || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fullName = profileData?.full_name || user?.full_name || 'Trader Member';
  const role = profileData?.role || 'User';
  const headline = profileData?.headline || 'Investor & Trading Community Member';
  const location = profileData?.location || 'Tunis, Tunisia';
  const bio = profileData?.bio || 'Passionate trader exploring currency, equity, and commodity markets.';
  const reputation = profileData?.reputation || 0;
  const initial = fullName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={styles.headerIconsRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')}>
            <Bell size={20} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
            <Settings size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Cover Photo Banner */}
        <View style={styles.coverBanner}>
          {profileData?.cover_image_url ? (
            <Image source={{ uri: profileData.cover_image_url }} style={styles.coverImg} />
          ) : (
            <View style={styles.coverGradient} />
          )}
        </View>

        {/* Profile Card Header */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarLarge}>
            {profileData?.avatar_url ? (
              <Image source={{ uri: profileData.avatar_url }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}
          </View>

          <Text style={styles.nameText}>{fullName}</Text>
          <Text style={styles.headlineText}>{headline}</Text>

          <View style={styles.locationRow}>
            <MapPin size={14} color="#94a3b8" style={{ marginRight: 4 }} />
            <Text style={styles.locationText}>{location}</Text>
          </View>

          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <Shield size={12} color={theme.colors.primaryLight} style={{ marginRight: 4 }} />
              <Text style={styles.badgeText}>{role.toUpperCase()}</Text>
            </View>
            
            <View style={[styles.badge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Award size={12} color="#f59e0b" style={{ marginRight: 4 }} />
              <Text style={[styles.badgeText, { color: '#f59e0b' }]}>{reputation} REPUTATION</Text>
            </View>
          </View>

          <View style={styles.connBox}>
            <Users size={16} color={theme.colors.primaryLight} style={{ marginRight: 6 }} />
            <Text style={styles.connText}>{connectionsCount} Active Connections</Text>
          </View>
        </View>

        {/* About & Bio Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About & Philosophy</Text>
          <Text style={styles.bioText}>{bio}</Text>
        </View>

        {/* Account Information Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          
          <View style={styles.infoRow}>
            <Mail size={18} color="#94a3b8" />
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <User size={18} color="#94a3b8" />
            <Text style={styles.infoLabel}>Verification Status</Text>
            <Text style={[styles.infoValue, { color: '#10b981' }]}>Verified Trader</Text>
          </View>

          <View style={styles.infoRow}>
            <Calendar size={18} color="#94a3b8" />
            <Text style={styles.infoLabel}>Joined</Text>
            <Text style={styles.infoValue}>
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active Member'}
            </Text>
          </View>
        </View>

        {/* Settings Launcher Button */}
        <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')} activeOpacity={0.8}>
          <Settings size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.settingsBtnText}>Open Messenger Settings</Text>
        </TouchableOpacity>

        {/* Action Button: Sign Out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <LogOut size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Sign Out of Investraders</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundDark,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.cardDark,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: theme.colors.borderDark,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  coverBanner: {
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: -40,
  },
  coverImg: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1d4ed8',
  },
  profileHeaderCard: {
    backgroundColor: theme.colors.cardDark,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 4,
    borderColor: theme.colors.cardDark,
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
  },
  nameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
  },
  headlineText: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 12,
    color: '#64748b',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: theme.colors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
  },
  connBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b1329',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  connText: {
    fontSize: 13,
    color: '#f8fafc',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: theme.colors.cardDark,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 10,
  },
  bioText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  infoLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginLeft: 10,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  settingsBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
