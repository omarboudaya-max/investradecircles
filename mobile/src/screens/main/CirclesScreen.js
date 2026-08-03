import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  TextInput 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { theme } from '../../theme/theme';
import { Users, Shield, ChevronRight, Search, Settings, Bell, Landmark, Briefcase, User, Plus } from 'lucide-react-native';

const CATEGORY_TABS = [
  { key: 'all', label: 'All Circles' },
  { key: 'individual', label: 'Individuals' },
  { key: 'institution', label: 'Institutions' },
  { key: 'chamber_of_commerce', label: 'Chambers of Commerce' },
];

export default function CirclesScreen({ navigation }) {
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const fetchCircles = async () => {
    try {
      const { data, error } = await supabase
        .from('Circle')
        .select('*')
        .order('created_date', { ascending: false });

      if (error) {
        console.error('Error fetching Circle table:', error);
      } else {
        setCircles(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCircles();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCircles();
  };

  const filteredCircles = circles.filter(c => {
    const matchesSearch = !searchQuery || 
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === 'all' || c.category === activeTab;

    return matchesSearch && matchesTab;
  });

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'institution':
        return { label: 'Institutional', color: '#f59e0b', Icon: Landmark };
      case 'chamber_of_commerce':
        return { label: 'Chamber of Commerce', color: '#06b6d4', Icon: Briefcase };
      default:
        return { label: 'Individual Trader', color: '#3b82f6', Icon: User };
    }
  };

  const renderCircleItem = ({ item }) => {
    const memberCount = Array.isArray(item.member_ids) ? item.member_ids.length : (item.members_count || 0);
    const catBadge = getCategoryBadge(item.category);
    const IconComp = catBadge.Icon;

    return (
      <TouchableOpacity 
        style={styles.circleCard}
        onPress={() => navigation.navigate('CircleDetail', { circleId: item.id, circleName: item.name })}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: `${catBadge.color}20` }]}>
            <IconComp size={22} color={catBadge.color} />
          </View>
          <View style={styles.headerText}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.circleTitle}>{item.name}</Text>
              {item.is_verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
            <Text style={[styles.circleCategory, { color: catBadge.color }]}>{catBadge.label}</Text>
          </View>
          <ChevronRight size={20} color="#64748b" />
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {item.description || 'Exclusive trading community & market discussions.'}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.metaBadge}>
            <Users size={14} color="#94a3b8" style={{ marginRight: 4 }} />
            <Text style={styles.metaText}>{memberCount} Members</Text>
          </View>

          {item.is_private && (
            <View style={styles.privateBadge}>
              <Shield size={12} color="#f59e0b" style={{ marginRight: 4 }} />
              <Text style={styles.privateText}>Private</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Trading Circles</Text>
          <View style={styles.headerIconsRow}>
            <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('CreateCircle')}>
              <Plus size={18} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.createBtnText}>Create</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')}>
              <Bell size={20} color="#94a3b8" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
              <Settings size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color="#64748b" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search individual, institutional & chamber circles..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Category Tabs */}
        <View style={styles.tabsRow}>
          {CATEGORY_TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity 
                key={tab.key} 
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primaryLight} />
        </View>
      ) : (
        <FlatList
          data={filteredCircles}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCircleItem}
          contentContainerStyle={styles.listPadding}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor={theme.colors.primaryLight} 
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No trading circles found in this category.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundDark,
  },
  topHeader: {
    backgroundColor: theme.colors.cardDark,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: theme.colors.borderDark,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b1329',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listPadding: {
    padding: 16,
  },
  circleCard: {
    backgroundColor: theme.colors.cardDark,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  circleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginRight: 6,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700',
  },
  circleCategory: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  privateText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 15,
  },
});
