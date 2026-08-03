import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Landmark, Briefcase, User, Globe, Check, AlertCircle } from 'lucide-react-native';

const CATEGORIES = [
  {
    value: 'individual',
    label: 'Individual',
    desc: 'Trader circle for individual traders & investors.',
    Icon: User,
    color: '#3b82f6',
  },
  {
    value: 'institution',
    label: 'Institution',
    desc: 'Official circle for financial institutions, VCs & funds.',
    Icon: Landmark,
    color: '#f59e0b',
  },
  {
    value: 'chamber_of_commerce',
    label: 'Chamber of Commerce',
    desc: 'Official circle for regional & international commerce chambers.',
    Icon: Briefcase,
    color: '#06b6d4',
  },
];

export default function CreateCircleScreen({ navigation }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('individual');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isInstitution = category === 'institution' || category === 'chamber_of_commerce';

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter a circle name.');
      return;
    }
    if (isInstitution && !websiteUrl.trim()) {
      setError('Website URL is required for institutional circles.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { data, error: insertError } = await supabase
        .from('Circle')
        .insert({
          name: name.trim(),
          description: description.trim(),
          category,
          privacy,
          website_url: isInstitution ? websiteUrl.trim() : null,
          created_by_id: user.id,
          member_ids: [user.id],
        })
        .select()
        .single();

      if (insertError) throw insertError;

      navigation.replace('CircleDetail', { circleId: data.id, circleName: data.name });
    } catch (err) {
      setError(err.message || 'Failed to create trading circle.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Trading Circle</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {!!error && (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color="#ef4444" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Category Picker */}
          <Text style={styles.label}>Circle Type</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const selected = category === cat.value;
              const IconComp = cat.Icon;
              return (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.categoryCard, selected && styles.categoryCardSelected]}
                  onPress={() => setCategory(cat.value)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.catIconWrap, { backgroundColor: `${cat.color}20` }]}>
                    <IconComp size={20} color={cat.color} />
                  </View>
                  <Text style={styles.catLabel}>{cat.label}</Text>
                  <Text style={styles.catDesc}>{cat.desc}</Text>
                  {selected && (
                    <View style={styles.checkBadge}>
                      <Check size={12} color="#ffffff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Circle Name */}
          <Text style={styles.label}>Circle Name *</Text>
          <TextInput
            style={styles.input}
            placeholder={isInstitution ? "e.g. Tunis Chamber of Commerce" : "e.g. Forex Scalpers Tunisia"}
            placeholderTextColor="#64748b"
            value={name}
            onChangeText={setName}
          />

          {/* Circle Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What is the mission & focus of this circle?"
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />

          {/* Website URL for Institutions */}
          {isInstitution && (
            <>
              <Text style={styles.label}>Website URL *</Text>
              <View style={styles.inputIconRow}>
                <Globe size={18} color="#64748b" style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0 }]}
                  placeholder="https://ccitunis.org.tn"
                  placeholderTextColor="#64748b"
                  keyboardType="url"
                  autoCapitalize="none"
                  value={websiteUrl}
                  onChangeText={setWebsiteUrl}
                />
              </View>
            </>
          )}

          {/* Privacy Option */}
          <Text style={styles.label}>Privacy Setting</Text>
          <View style={styles.privacyRow}>
            <TouchableOpacity 
              style={[styles.privacyOption, privacy === 'public' && styles.privacySelected]}
              onPress={() => setPrivacy('public')}
            >
              <Text style={[styles.privacyText, privacy === 'public' && styles.privacyTextSelected]}>Public</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.privacyOption, privacy === 'private' && styles.privacySelected]}
              onPress={() => setPrivacy('private')}
            >
              <Text style={[styles.privacyText, privacy === 'private' && styles.privacyTextSelected]}>Private</Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitText}>Create Circle Now</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.cardDark,
    borderBottomWidth: 1,
    borderColor: theme.colors.borderDark,
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  content: {
    padding: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
    marginTop: 14,
  },
  categoryGrid: {
    gap: 10,
    marginBottom: 10,
  },
  categoryCard: {
    backgroundColor: theme.colors.cardDark,
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: theme.colors.borderDark,
    position: 'relative',
  },
  categoryCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  catIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  catLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  catDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: '#0b1329',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  inputIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b1329',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  privacyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  privacyOption: {
    flex: 1,
    backgroundColor: theme.colors.cardDark,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
  },
  privacySelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  privacyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  privacyTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
