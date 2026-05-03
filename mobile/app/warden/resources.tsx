import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Package,
  Box,
  Tag,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Pencil,
  Trash2,
  X,
  Save,
  CheckCircle,
  Barcode,
} from 'lucide-react-native';

import { Colors } from '../../constants/Colors';
import api from '../../services/api';

type ResourceStatus =
  | 'AVAILABLE'
  | 'ALLOCATED'
  | 'MAINTENANCE'
  | 'OCCUPIED'
  | 'MISSING'
  | string;

type ResourceItem = {
  _id: string;

  name?: string | null;
  itemName?: string | null;
  resourceName?: string | null;

  category?: string | null;
  type?: string | null;
  itemType?: string | null;

  status?: ResourceStatus;
  resourceStatus?: ResourceStatus;
  itemStatus?: ResourceStatus;
  availabilityStatus?: ResourceStatus;

  uniqueCode?: string | null;
  furnitureCode?: string | null;
  code?: string | null;
  resourceCode?: string | null;
  itemCode?: string | null;

  roomRef?: string | null;
  roomNumber?: string | null;
  floorNumber?: number | string | null;

  items?: Array<{
    bedId?: string;
    itemType?: string;
    type?: string;
    uniqueCode?: string | null;
    furnitureCode?: string | null;
    code?: string | null;
    resourceCode?: string | null;
    itemCode?: string | null;
    status?: ResourceStatus;
    itemStatus?: ResourceStatus;
  }>;
};

const theme = {
  background: (Colors as any).background || (Colors as any).bg || '#F8FAFC',
  surface: (Colors as any).surface || (Colors as any).bgCard || '#FFFFFF',
  card: (Colors as any).surface || (Colors as any).bgCard || '#FFFFFF',
  input: (Colors as any).bgInput || '#F1F5F9',
  border: (Colors as any).border || '#E2E8F0',
  text: (Colors as any).text || (Colors as any).textPrimary || '#0F172A',
  muted: (Colors as any).textMuted || (Colors as any).textSecondary || '#64748B',
  primary: (Colors as any).primary || '#4F46E5',
  success: (Colors as any).success || '#10B981',
  warning: (Colors as any).warning || '#F59E0B',
  danger: (Colors as any).danger || '#EF4444',
  info: (Colors as any).info || '#3B82F6',
};

const statusOptions: ResourceStatus[] = [
  'AVAILABLE',
  'ALLOCATED',
  'MAINTENANCE',
  'OCCUPIED',
  'MISSING',
];

export default function HostelResources() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<'common' | 'student'>('common');
  const [searchText, setSearchText] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    status: 'AVAILABLE' as ResourceStatus,
  });

  const normalizeStatus = (value?: ResourceStatus | null) => {
    if (!value) return 'UNKNOWN';
    return String(value).trim().toUpperCase();
  };

  const getResourceName = (item: ResourceItem) => {
    return (
      item.name ||
      item.itemName ||
      item.resourceName ||
      item.items?.[0]?.itemType ||
      item.items?.[0]?.type ||
      item.roomRef ||
      'Unnamed Resource'
    );
  };

  const getResourceCategory = (item: ResourceItem) => {
    return (
      item.category ||
      item.type ||
      item.itemType ||
      item.items?.[0]?.itemType ||
      item.items?.[0]?.type ||
      'GENERAL'
    );
  };

  const getResourceStatus = (item: ResourceItem) => {
    return normalizeStatus(
      item.status ||
        item.resourceStatus ||
        item.itemStatus ||
        item.availabilityStatus ||
        item.items?.[0]?.status ||
        item.items?.[0]?.itemStatus
    );
  };

  const getFurnitureCode = (item: ResourceItem) => {
    const code =
      item.uniqueCode ||
      item.furnitureCode ||
      item.resourceCode ||
      item.itemCode ||
      item.code ||
      item.items?.[0]?.uniqueCode ||
      item.items?.[0]?.furnitureCode ||
      item.items?.[0]?.resourceCode ||
      item.items?.[0]?.itemCode ||
      item.items?.[0]?.code;

    // Log for debugging
    if (!code) {
      console.log('No code found for resource:', item.name || item._id, 'Raw item:', item);
    }

    return code || 'No Code';
  };

  const isStudentFloorItem = (item: ResourceItem) => {
    return (
      !!item.roomRef ||
      !!item.roomNumber ||
      !!item.floorNumber ||
      !!(item.items && item.items.length > 0)
    );
  };

  const extractResourcesFromResponse = (data: any) => {
    let resources = [];
    
    // Handle various response formats
    if (Array.isArray(data)) {
      resources = data;
    } else if (Array.isArray(data?.resources)) {
      resources = data.resources;
    } else if (Array.isArray(data?.data)) {
      resources = data.data;
    } else if (Array.isArray(data?.items)) {
      resources = data.items;
    } else if (Array.isArray(data?.result)) {
      resources = data.result;
    } else {
      return [];
    }

    // Ensure all nested fields are properly preserved
    return resources.map((item: any) => ({
      ...item,
      // Ensure items array is preserved with all fields
      items: Array.isArray(item.items)
        ? item.items.map((i: any) => ({
            ...i,
            bedId: i.bedId,
            itemType: i.itemType,
            uniqueCode: i.uniqueCode,
            status: i.status,
          }))
        : [],
    }));
  };

  const fetchResources = async (silent = false, attempt = 0) => {
    try {
      if (attempt === 0) {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
      }

      const timestamp = Date.now();
      console.log(`[${new Date(timestamp).toLocaleTimeString()}] Fetching resources (attempt ${attempt + 1})...`);
      
      const res = await api.get(`/resources?nocache=${timestamp}`);
      const latestResources = extractResourcesFromResponse(res.data);

      console.log(`[${new Date(timestamp).toLocaleTimeString()}] API Response received:`, res.data);
      console.log(`[${new Date(timestamp).toLocaleTimeString()}] Extracted ${latestResources.length} resources`);
      
      // Detailed logging for each resource
      latestResources.forEach((resource: ResourceItem, index: number) => {
        console.log(`Resource ${index + 1}:`, {
          _id: resource._id,
          name: resource.name,
          category: resource.category,
          status: resource.status,
          uniqueCode: resource.uniqueCode,
          furnitureCode: resource.furnitureCode,
          itemCode: resource.itemCode,
          code: resource.code,
          hasItems: !!resource.items?.length,
          itemsCount: resource.items?.length || 0,
          firstItem: resource.items?.[0] ? {
            bedId: resource.items[0].bedId,
            itemType: resource.items[0].itemType,
            uniqueCode: resource.items[0].uniqueCode,
            status: resource.items[0].status,
          } : null,
        });
      });

      setResources(latestResources);
      console.log(`[${new Date(timestamp).toLocaleTimeString()}] State updated with ${latestResources.length} resources`);
    } catch (err: any) {
      console.error('[ERROR] Fetch resources error:', err?.message || err);
      console.error('[ERROR] Full error:', err);
      
      // Retry logic
      const maxRetries = 3;
      if (attempt < maxRetries && (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ECONNABORTED')) {
        const delayMs = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`[INFO] Retrying in ${delayMs}ms...`);
        setTimeout(() => {
          fetchResources(silent, attempt + 1);
        }, delayMs);
        return;
      }
      
      // Provide helpful error messages
      let errorMessage = 'Failed to load resources';
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - Server is taking too long to respond. Please try again.';
      } else if (err.code === 'ENOTFOUND' || err.message?.includes('Network Error')) {
        errorMessage = 'Network error - Cannot reach the server. Check your connection or try again.';
      } else if (err.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused - Backend server may be offline. Please try again in a moment.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Unauthorized - Please log in again';
      } else if (err.response?.status === 404) {
        errorMessage = 'Resources endpoint not found';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      if (!silent) {
        Alert.alert('Error', errorMessage);
      } else {
        console.warn('[WARNING] Silent refresh failed:', errorMessage);
      }
    } finally {
      if (attempt === 0) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    console.log('useEffect: Mounting component, fetching initial resources');
    fetchResources();
    
    // Set up polling to refresh data every 3 seconds for real-time updates
    const pollInterval = setInterval(() => {
      fetchResources(true);
    }, 3000);

    return () => {
      console.log('useEffect: Cleaning up polling interval');
      clearInterval(pollInterval);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('useFocusEffect: Screen focused, immediately refreshing resources');
      // Refresh immediately and forcefully when screen comes into focus
      fetchResources(true);
      // Also do another fetch after a short delay to catch any rapid updates
      setTimeout(() => {
        fetchResources(true);
      }, 500);
    }, [])
  );

  const totalResources = resources.length;

  const commonAreaCount = resources.filter(
    item => !isStudentFloorItem(item)
  ).length;

  const studentFloorCount = resources.filter(
    item => isStudentFloorItem(item)
  ).length;

  const availableCount = resources.filter(
    item => getResourceStatus(item) === 'AVAILABLE'
  ).length;

  const filteredResources = useMemo(() => {
    const keyword = searchText.toLowerCase().trim();

    return resources.filter(item => {
      const name = getResourceName(item).toLowerCase();
      const category = getResourceCategory(item).toLowerCase();
      const status = getResourceStatus(item).toLowerCase();
      const code = getFurnitureCode(item).toLowerCase();
      const roomRef = String(item.roomRef || item.roomNumber || '').toLowerCase();

      const matchesSearch =
        keyword === '' ||
        name.includes(keyword) ||
        category.includes(keyword) ||
        status.includes(keyword) ||
        code.includes(keyword) ||
        roomRef.includes(keyword);

      const matchesTab =
        activeTab === 'common'
          ? !isStudentFloorItem(item)
          : isStudentFloorItem(item);

      return matchesSearch && matchesTab;
    });
  }, [resources, searchText, activeTab]);

  const getStatusColor = (status?: ResourceStatus) => {
    const normalized = normalizeStatus(status);

    switch (normalized) {
      case 'AVAILABLE':
        return theme.success;
      case 'ALLOCATED':
      case 'OCCUPIED':
        return theme.info;
      case 'MAINTENANCE':
        return theme.warning;
      case 'MISSING':
        return theme.warning;
      default:
        return theme.muted;
    }
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      category: '',
      status: 'AVAILABLE',
    });
    setShowAddModal(true);
  };

  const openEditStatusModal = (item: ResourceItem) => {
    setEditingResource(item);
    setFormData({
      name: getResourceName(item),
      category: getResourceCategory(item),
      status: getResourceStatus(item),
    });
    setShowStatusModal(true);
  };

  const handleCreateResource = async () => {
    if (!formData.name.trim() || !formData.category.trim()) {
      Alert.alert('Missing Details', 'Please enter resource name and category.');
      return;
    }

    try {
      setSaving(true);

      await api.post('/resources', {
        name: formData.name.trim(),
        category: formData.category.trim(),
        status: formData.status,
      });

      setShowAddModal(false);
      await fetchResources(true);
      Alert.alert('Success', 'Resource added successfully.');
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.message || 'Failed to create resource'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!editingResource?._id) return;

    try {
      setSaving(true);

      await api.put(`/resources/${editingResource._id}`, {
        status: formData.status,
        resourceStatus: formData.status,
        itemStatus: formData.status,
        availabilityStatus: formData.status,
      });

      setShowStatusModal(false);
      setEditingResource(null);
      await fetchResources(true);
      Alert.alert('Success', 'Resource status updated.');
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.message || 'Failed to update resource'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResource = (item: ResourceItem) => {
    Alert.alert(
      'Delete Resource',
      `Are you sure you want to delete "${getResourceName(item)}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/resources/${item._id}`);
              await fetchResources(true);
              Alert.alert('Deleted', 'Resource deleted successfully.');
            } catch (err: any) {
              Alert.alert(
                'Error',
                err?.response?.data?.message || 'Failed to delete resource'
              );
            }
          },
        },
      ]
    );
  };

  const renderStatusSelector = () => (
    <View style={styles.statusOptions}>
      {statusOptions.map(status => {
        const selected = normalizeStatus(formData.status) === normalizeStatus(status);

        return (
          <TouchableOpacity
            key={status}
            onPress={() => setFormData(prev => ({ ...prev, status }))}
            style={[
              styles.statusOption,
              selected && {
                backgroundColor: getStatusColor(status) + '22',
                borderColor: getStatusColor(status),
              },
            ]}
          >
            <Text
              style={[
                styles.statusOptionText,
                selected && { color: getStatusColor(status) },
              ]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderResourceItem = ({ item }: { item: ResourceItem }) => {
    const status = getResourceStatus(item);
    const statusColor = getStatusColor(status);
    const studentFloorResource = isStudentFloorItem(item);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Box size={24} color={theme.primary} />
          </View>

          <View style={styles.info}>
            <Text style={styles.resourceName}>{getResourceName(item)}</Text>

            <Text style={styles.resourceType}>
              {activeTab === 'common'
                ? getResourceCategory(item)
                : `${item.roomRef || item.roomNumber ? `Room ${item.roomRef || item.roomNumber}` : 'Student Floor Resource'}${
                    item.floorNumber ? ` ΓÇó Floor ${item.floorNumber}` : ''
                  }`}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + '18' },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {status}
            </Text>
          </View>
        </View>

        {activeTab === 'common' && (
          <View style={styles.commonAreaBox}>
            <Text style={styles.commonAreaTitle}>Common Area Resource</Text>
            <Text style={styles.commonAreaText}>
              This item is used for shared hostel spaces or general inventory.
            </Text>
          </View>
        )}

        {activeTab === 'student' && (
          <View style={styles.studentFloorBox}>
            <Text style={styles.studentFloorTitle}>
              {item.roomRef || item.roomNumber
                ? `Room Ref: ${item.roomRef || item.roomNumber}`
                : 'Floor-based Resource'}
            </Text>

            <Text style={styles.studentFloorText}>
              {item.floorNumber
                ? `Floor ${item.floorNumber}`
                : 'No floor number available'}
            </Text>

            <Text style={styles.studentFloorText}>
              {item.items?.length
                ? `${item.items.length} room item(s) recorded`
                : 'No room items recorded'}
            </Text>
          </View>
        )}

        <View style={styles.codeBox}>
          <View style={styles.codeHeader}>
            <Barcode size={15} color={theme.primary} />
            <Text style={styles.codeLabel}>Furniture Code</Text>
          </View>
          <Text style={styles.codeValue}>{getFurnitureCode(item)}</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.tag}>
            <Tag size={12} color={theme.muted} />
            <Text style={styles.tagText}>{getResourceCategory(item)}</Text>
          </View>

          <View style={styles.tag}>
            <Layers size={12} color={theme.muted} />
            <Text style={styles.tagText}>
              {studentFloorResource
                ? item.roomRef || item.roomNumber || `Floor ${item.floorNumber || '-'}`
                : 'Common Area'}
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => openEditStatusModal(item)}
          >
            <Pencil size={16} color={theme.primary} />
            <Text style={[styles.actionText, { color: theme.primary }]}>
              Edit Status
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteResource(item)}
          >
            <Trash2 size={16} color={theme.danger} />
            <Text style={[styles.actionText, { color: theme.danger }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.summaryCard}>
          <Text style={styles.sumVal}>{totalResources}</Text>
          <Text style={styles.sumLab}>Total</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={[styles.sumVal, { color: theme.success }]}>
            {availableCount}
          </Text>
          <Text style={styles.sumLab}>Available</Text>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Plus size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={18} color={theme.muted} />
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder={
            activeTab === 'common'
              ? 'Search common resources or code...'
              : 'Search floor resources or code...'
          }
          placeholderTextColor={theme.muted}
          style={styles.searchInput}
        />

        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <X size={18} color={theme.muted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          onPress={() => setActiveTab('common')}
          style={[
            styles.tabButton,
            activeTab === 'common' && styles.activeTab,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'common' && styles.activeTabText,
            ]}
          >
            Common Areas ({commonAreaCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('student')}
          style={[
            styles.tabButton,
            activeTab === 'student' && styles.activeTab,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'student' && styles.activeTabText,
            ]}
          >
            Student Floors ({studentFloorCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => fetchResources(true)}
          disabled={refreshing || loading}
        >
          {refreshing || loading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <RefreshCw size={18} color={theme.text} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>
          {activeTab === 'common' ? 'Common Areas' : 'Student Floors'}
        </Text>

        <Text style={styles.infoText}>
          {activeTab === 'common'
            ? 'Showing shared hostel resources such as chairs, tables, common room items, and general inventory.'
            : 'Showing room and floor-based resources related to student accommodation areas.'}
        </Text>
      </View>

      {loading && resources.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading resources...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredResources}
          renderItem={renderResourceItem}
          keyExtractor={(item, index) => item._id || String(index)}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => fetchResources(true)}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package size={48} color={theme.muted} />
              <Text style={styles.emptyText}>
                {activeTab === 'common'
                  ? 'No common area resources found'
                  : 'No student floor resources found'}
              </Text>
              <Text style={styles.emptySubText}>
                Try changing the search or add a new resource.
              </Text>
            </View>
          }
        />
      )}

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Resource</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Resource Name</Text>
              <TextInput
                value={formData.name}
                onChangeText={text =>
                  setFormData(prev => ({ ...prev, name: text }))
                }
                placeholder="e.g. Office Chair"
                placeholderTextColor={theme.muted}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                value={formData.category}
                onChangeText={text =>
                  setFormData(prev => ({ ...prev, category: text }))
                }
                placeholder="e.g. Furniture"
                placeholderTextColor={theme.muted}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Status</Text>
              {renderStatusSelector()}

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.disabledBtn]}
                onPress={handleCreateResource}
                disabled={saving}
              >
                <Save size={18} color="#FFF" />
                <Text style={styles.saveBtnText}>
                  {saving ? 'Saving...' : 'Save Resource'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showStatusModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <X size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalResourceName}>
              {editingResource ? getResourceName(editingResource) : ''}
            </Text>

            <Text style={styles.inputLabel}>Select New Status</Text>
            {renderStatusSelector()}

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.disabledBtn]}
              onPress={handleUpdateStatus}
              disabled={saving}
            >
              <CheckCircle size={18} color="#FFF" />
              <Text style={styles.saveBtnText}>
                {saving ? 'Updating...' : 'Update Status'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', padding: 16, gap: 12, alignItems: 'center' },
  summaryCard: { flex: 1, backgroundColor: theme.surface, padding: 18, borderRadius: 22, borderWidth: 1, borderColor: theme.border },
  sumVal: { fontSize: 24, fontWeight: '900', color: theme.text },
  sumLab: { fontSize: 11, fontWeight: '800', color: theme.muted, textTransform: 'uppercase', marginTop: 4 },
  addBtn: { width: 62, height: 62, backgroundColor: theme.primary, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  searchContainer: { marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 14, height: 52, borderRadius: 18, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.input, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, color: theme.text, fontSize: 14, fontWeight: '700' },
  tabRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tabButton: { paddingHorizontal: 13, paddingVertical: 11, borderRadius: 14, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  activeTab: { backgroundColor: theme.primary, borderColor: theme.primary },
  tabText: { color: theme.muted, fontSize: 11, fontWeight: '900' },
  activeTabText: { color: '#FFF' },
  refreshBtn: { marginLeft: 'auto', width: 46, height: 46, borderRadius: 14, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  infoBox: { marginHorizontal: 16, marginBottom: 8, padding: 14, backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border },
  infoTitle: { color: theme.text, fontSize: 13, fontWeight: '900', marginBottom: 4 },
  infoText: { color: theme.muted, fontSize: 12, fontWeight: '600', lineHeight: 18 },
  list: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: theme.card, borderRadius: 24, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  iconBox: { width: 50, height: 50, backgroundColor: theme.background, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  resourceName: { fontSize: 16, fontWeight: '900', color: theme.text },
  resourceType: { fontSize: 12, color: theme.muted, fontWeight: '700', marginTop: 3, textTransform: 'uppercase' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '900' },
  commonAreaBox: { padding: 12, borderRadius: 14, backgroundColor: theme.success + '10', marginBottom: 12 },
  commonAreaTitle: { color: theme.success, fontSize: 12, fontWeight: '900' },
  commonAreaText: { color: theme.muted, fontSize: 11, fontWeight: '700', marginTop: 3 },
  studentFloorBox: { padding: 12, borderRadius: 14, backgroundColor: theme.info + '10', marginBottom: 12 },
  studentFloorTitle: { color: theme.info, fontSize: 12, fontWeight: '900' },
  studentFloorText: { color: theme.muted, fontSize: 11, fontWeight: '700', marginTop: 3 },
  codeBox: { padding: 12, borderRadius: 14, backgroundColor: theme.primary + '10', borderWidth: 1, borderColor: theme.primary + '25', marginBottom: 12 },
  codeHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  codeLabel: { color: theme.muted, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  codeValue: { color: theme.primary, fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  cardFooter: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.background, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  tagText: { fontSize: 11, fontWeight: '800', color: theme.muted, textTransform: 'uppercase' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionButton: { flex: 1, paddingVertical: 12, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  editButton: { backgroundColor: theme.primary + '15' },
  deleteButton: { backgroundColor: theme.danger + '15' },
  actionText: { fontSize: 12, fontWeight: '900' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: theme.muted, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  emptyText: { fontSize: 16, color: theme.text, fontWeight: '900', marginTop: 12 },
  emptySubText: { fontSize: 13, color: theme.muted, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: theme.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 22, maxHeight: '85%', borderWidth: 1, borderColor: theme.border },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  modalTitle: { flex: 1, color: theme.text, fontSize: 22, fontWeight: '900' },
  modalResourceName: { color: theme.muted, fontSize: 14, fontWeight: '800', marginBottom: 18 },
  inputLabel: { color: theme.muted, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: theme.input, borderWidth: 1, borderColor: theme.border, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: theme.text, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  statusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  statusOption: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.input },
  statusOptionText: { color: theme.muted, fontSize: 11, fontWeight: '900' },
  saveBtn: { backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, marginTop: 10 },
  saveBtnText: { color: '#FFF', fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  disabledBtn: { opacity: 0.6 },
});
