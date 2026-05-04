import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Pressable,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Colors from '../../constants/Colors';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  X,
  Send,
  Paperclip,
  Trash2,
  ArrowLeft,
  FileText,
  ChevronDown
} from 'lucide-react-native';
import api from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  _id?: string;
  content?: string;
  senderRole: 'warden' | 'student';
  fileUrl?: string;
  fileType?: 'image' | 'document';
  createdAt: string;
}

interface Complaint {
  _id: string;
  title?: string;
  subject?: string;
  category?: string;
  status: string;
  description?: string;
  messages?: Message[];
  wardenUnreadCount?: number;
  submittedBy?: { name?: string; studentId?: string };
  studentName?: string;
  studentRollNumber?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStatusColor = (status: string) => {
  const s = status?.toLowerCase().replace(/\s/g, '').replace(/-/g, '');
  switch (s) {
    case 'resolved':    return '#10B981';
    case 'inprogress':  return '#F59E0B';
    case 'open':        return '#EF4444';
    case 'pending':     return '#F59E0B';
    default:            return Colors.textMuted;
  }
};

const getStatusLabel = (status: string) => {
  const s = status?.toLowerCase().replace(/\s/g, '').replace(/-/g, '');
  switch (s) {
    case 'inprogress':  return 'In Progress';
    case 'resolved':    return 'Resolved';
    case 'open':        return 'Open';
    case 'pending':     return 'Pending';
    default:            return status ?? 'Unknown';
  }
};

const getStatusIcon = (status: string, size = 16) => {
  const s = status?.toLowerCase().replace(/\s/g, '').replace(/-/g, '');
  switch (s) {
    case 'resolved':    return <CheckCircle size={size} color="#10B981" />;
    case 'inprogress':  return <Clock size={size} color="#F59E0B" />;
    case 'open':        return <AlertCircle size={size} color="#EF4444" />;
    default:            return <MessageSquare size={size} color={Colors.textMuted} />;
  }
};

const getStudentName = (c: Complaint) =>
  c.submittedBy?.name || c.studentName || 'Unknown Student';
const getStudentId = (c: Complaint) =>
  c.submittedBy?.studentId || c.studentRollNumber || '';
const getTitle = (c: Complaint) => c.title || c.subject || 'Untitled';

const WARDEN_COLOR = (Colors.roles as any)?.warden ?? '#6366F1';
const BORDER_COLOR = (Colors as any).border ?? '#E2E8F0';

// ─── Component ────────────────────────────────────────────────────────────────

export default function WardenComplaints() {
  const [complaints, setComplaints]           = useState<Complaint[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [filter, setFilter]                   = useState('all');
  const [search, setSearch]                   = useState('');
  const [refreshing, setRefreshing]           = useState(false);

  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);
  const [chatView, setChatView]               = useState(false);
  const [chatLoading, setChatLoading]         = useState(false);

  const [message, setMessage]                 = useState('');
  const [sending, setSending]                 = useState(false);
  const [selectedFile, setSelectedFile]       = useState<{
    uri: string; name: string; type: string; size?: number;
  } | null>(null);

  const [showStatusMenu, setShowStatusMenu]   = useState(false);
  const [statusUpdating, setStatusUpdating]   = useState(false);
  const [deleting, setDeleting]               = useState(false);

  const scrollRef  = useRef<ScrollView>(null);
  const prevMsgLen = useRef(0);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchComplaints = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await api.get('/complaints');
      const list: Complaint[] = Array.isArray(res.data)
        ? res.data : res.data?.data ?? [];
      setComplaints(list);
    } catch (err) {
      console.error('Fetch complaints error:', err);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  const fetchSingle = useCallback(async (id: string, showLoader = true) => {
    if (showLoader) setChatLoading(true);
    try {
      const res = await api.get(`/complaints/${id}`);
      const updated: Complaint = res.data?.data ?? res.data;
      setActiveComplaint(updated);
      setComplaints(prev => prev.map(c => c._id === id ? { ...c, ...updated } : c));
    } catch (err) {
      console.error('Fetch single error:', err);
    } finally {
      if (showLoader) setChatLoading(false);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchComplaints(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchComplaints();
    const iv = setInterval(() => fetchComplaints(false), 4000);
    return () => clearInterval(iv);
  }, [fetchComplaints]);

  useEffect(() => {
    if (!chatView || !activeComplaint) return;
    const iv = setInterval(() => fetchSingle(activeComplaint._id, false), 2000);
    return () => clearInterval(iv);
  }, [chatView, activeComplaint?._id]);

  useEffect(() => {
    const len = activeComplaint?.messages?.length ?? 0;
    if (len > prevMsgLen.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    }
    prevMsgLen.current = len;
  }, [activeComplaint?.messages?.length]);

  // ── Navigation ────────────────────────────────────────────────────────────

  const openChat = async (c: Complaint) => {
    prevMsgLen.current = 0;
    setActiveComplaint(c);
    setChatView(true);
    await fetchSingle(c._id);
  };

  const closeChat = () => {
    setChatView(false);
    setActiveComplaint(null);
    setMessage('');
    setSelectedFile(null);
    setShowStatusMenu(false);
  };

  // ── File picking ──────────────────────────────────────────────────────────

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to attach images.'); return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setSelectedFile({ uri: a.uri, name: a.fileName ?? `photo_${Date.now()}.jpg`, type: a.mimeType ?? 'image/jpeg' });
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf','application/msword',
             'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const a = result.assets[0];
      if (a.size && a.size > 10 * 1024 * 1024) { Alert.alert('File too large', 'Max 10 MB.'); return; }
      setSelectedFile({ uri: a.uri, name: a.name, type: a.mimeType ?? 'application/octet-stream', size: a.size });
    }
  };

  const showAttachMenu = () =>
    Alert.alert('Attach File', 'Choose type', [
      { text: 'Photo / Image', onPress: pickImage },
      { text: 'Document (PDF/Word)', onPress: pickDocument },
      { text: 'Cancel', style: 'cancel' },
    ]);

  // ── Send ──────────────────────────────────────────────────────────────────

  const sendMessage = async () => {
    if (!activeComplaint || sending || (!message.trim() && !selectedFile)) return;
    setSending(true);
    try {
      const fd = new FormData();
      if (message.trim()) fd.append('content', message.trim());
      if (selectedFile) fd.append('file', { uri: selectedFile.uri, name: selectedFile.name, type: selectedFile.type } as any);
      const res = await api.post(`/complaints/${activeComplaint._id}/message`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updated: Complaint = res.data?.data ?? res.data;
      setActiveComplaint(updated);
      setComplaints(prev => prev.map(c => c._id === activeComplaint._id ? { ...c, ...updated } : c));
      setMessage('');
      setSelectedFile(null);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  // ── Status ────────────────────────────────────────────────────────────────

  const updateStatus = async (s: string) => {
    if (!activeComplaint) return;
    setStatusUpdating(true); setShowStatusMenu(false);
    try {
      await api.patch(`/complaints/${activeComplaint._id}/status`, { status: s });
      setActiveComplaint(prev => prev ? { ...prev, status: s } : prev);
      setComplaints(prev => prev.map(c => c._id === activeComplaint._id ? { ...c, status: s } : c));
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update status');
    } finally { setStatusUpdating(false); }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = (c: Complaint) =>
    Alert.alert('Delete Complaint', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setDeleting(true);
        try {
          await api.delete(`/complaints/${c._id}/warden`);
          setComplaints(prev => prev.filter(x => x._id !== c._id));
          if (chatView) closeChat();
        } catch (err: any) {
          Alert.alert('Error', err.response?.data?.message || 'Failed to delete');
        } finally { setDeleting(false); }
      }},
    ]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const filtered = complaints
    .filter(c => filter === 'all' || c.status === filter)
    .filter(c => !search ||
      getTitle(c).toLowerCase().includes(search.toLowerCase()) ||
      getStudentName(c).toLowerCase().includes(search.toLowerCase()) ||
      getStudentId(c).toLowerCase().includes(search.toLowerCase()));

  const counts = {
    all: complaints.length,
    open: complaints.filter(c => c.status === 'open').length,
    'in-progress': complaints.filter(c => c.status === 'in-progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAT VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  if (chatView && activeComplaint) {
    const sc       = getStatusColor(activeComplaint.status);
    const msgCount = activeComplaint.messages?.length ?? 0;
    const canSend  = (message.trim().length > 0 || !!selectedFile) && !sending;

    return (
      // SafeAreaView handles notch + status bar at top
      // KeyboardAvoidingView handles keyboard pushing content up
      <SafeAreaView style={s.safeArea}>
        <KeyboardAvoidingView
          style={s.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
        >
          {/* Header */}
          <View style={s.chatHeader}>
            <TouchableOpacity style={s.iconBtn} onPress={closeChat}>
              <ArrowLeft size={20} color={Colors.text} />
            </TouchableOpacity>

            <View style={s.avatar}>
              <Text style={s.avatarTxt}>
                {getStudentName(activeComplaint).charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={s.chatHeaderInfo}>
              <Text style={s.chatTitle} numberOfLines={1}>{getTitle(activeComplaint)}</Text>
              <Text style={s.chatSub} numberOfLines={1}>
                {getStudentName(activeComplaint)}
                {getStudentId(activeComplaint) ? ` · ${getStudentId(activeComplaint)}` : ''}
              </Text>
            </View>

            {/* Status pill */}
            <View>
              <TouchableOpacity
                style={[s.statusPill, { borderColor: sc + '55', backgroundColor: sc + '18' }]}
                onPress={() => setShowStatusMenu(v => !v)}
                disabled={statusUpdating}
              >
                <View style={[s.dot, { backgroundColor: sc }]} />
                <Text style={[s.statusPillTxt, { color: sc }]}>
                  {statusUpdating ? '…' : getStatusLabel(activeComplaint.status)}
                </Text>
                <ChevronDown size={11} color={sc} />
              </TouchableOpacity>

              {showStatusMenu && (
                <View style={s.statusMenu}>
                  {(['open', 'in-progress', 'resolved'] as const).map(st => {
                    // Match logic that handles both hyphenated and non-hyphenated versions
                    const isSelected = activeComplaint.status.toLowerCase().replace(/-/g, '') === st.replace(/-/g, '');
                    return (
                      <TouchableOpacity
                        key={st}
                        style={[s.statusMenuItem, isSelected && s.statusMenuItemOn]}
                        onPress={() => updateStatus(st)}
                      >
                        <View style={[s.dot, { backgroundColor: getStatusColor(st) }]} />
                        <Text style={s.statusMenuTxt}>{getStatusLabel(st)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[s.iconBtn, { backgroundColor: '#FEF2F2' }]}
              onPress={() => handleDelete(activeComplaint)}
              disabled={deleting}
            >
              <Trash2 size={17} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {/* Messages area */}
          <Pressable style={s.flex} onPress={() => setShowStatusMenu(false)}>
            {chatLoading ? (
              <View style={s.centered}>
                <ActivityIndicator size="large" color={WARDEN_COLOR} />
              </View>
            ) : (
              <ScrollView
                ref={scrollRef}
                style={s.flex}
                contentContainerStyle={s.msgContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >
                {msgCount === 0 && (
                  <View style={s.emptyChat}>
                    <MessageSquare size={40} color={Colors.textMuted} />
                    <Text style={s.emptyChatTitle}>No messages yet</Text>
                    <Text style={s.emptyChatSub}>Reply below to start the conversation</Text>
                  </View>
                )}

                {activeComplaint.messages?.map((msg, idx) => {
                  const isW = msg.senderRole === 'warden';
                  return (
                    <View key={msg._id ?? idx} style={[s.msgRow, isW ? s.msgRight : s.msgLeft]}>
                      <View style={[s.bubble, isW ? s.bubbleW : s.bubbleS]}>
                        {msg.fileUrl && (
                          <View style={{ marginBottom: msg.content ? 8 : 0 }}>
                            {msg.fileType === 'image' ? (
                              <Image source={{ uri: msg.fileUrl }} style={s.msgImg} resizeMode="cover" />
                            ) : (
                              <View style={[s.docRow, isW ? s.docRowW : s.docRowS]}>
                                <View style={s.docIcon}>
                                  <FileText size={18} color={isW ? '#fff' : WARDEN_COLOR} />
                                </View>
                                <Text style={[s.docLabel, { color: isW ? '#fff' : Colors.text }]}>
                                  View Document
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                        {!!msg.content && (
                          <Text style={[s.msgTxt, isW ? s.msgTxtW : s.msgTxtS]}>{msg.content}</Text>
                        )}
                      </View>
                      <View style={[s.meta, isW ? s.metaR : s.metaL]}>
                        <Text style={s.metaSender}>{isW ? 'You (Warden)' : getStudentName(activeComplaint)}</Text>
                        <Text style={s.metaTime}>
                          {' · '}{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </Pressable>

          {/* ── INPUT BAR ── */}
          <View style={s.inputBar}>
            {/* File preview */}
            {selectedFile && (
              <View style={s.fileStrip}>
                <View style={s.fileStripThumb}>
                  {selectedFile.type.startsWith('image/')
                    ? <Image source={{ uri: selectedFile.uri }} style={s.fileThumb} />
                    : <FileText size={20} color={WARDEN_COLOR} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                  {selectedFile.size != null && (
                    <Text style={s.fileSize}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => setSelectedFile(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}

            {/* Compose row */}
            <View style={s.composeRow}>
              <TouchableOpacity style={s.attachBtn} onPress={showAttachMenu}>
                <Paperclip size={20} color={Colors.textMuted} />
              </TouchableOpacity>

              <TextInput
                style={s.textInput}
                value={message}
                onChangeText={setMessage}
                placeholder="Type your reply..."
                placeholderTextColor={Colors.textMuted}
                multiline
                maxLength={2000}
                returnKeyType="default"
                blurOnSubmit={false}
              />

              <TouchableOpacity
                style={[s.sendBtn, !canSend && s.sendBtnOff]}
                onPress={sendMessage}
                disabled={!canSend}
                activeOpacity={0.8}
              >
                {sending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Send size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  const renderItem = ({ item }: { item: Complaint }) => {
    const color   = getStatusColor(item.status);
    const lastMsg = item.messages?.[item.messages.length - 1];
    return (
      <TouchableOpacity style={s.card} onPress={() => openChat(item)} activeOpacity={0.85}>
        <View style={s.cardHeader}>
          <View style={[s.dot, { backgroundColor: color, width: 8, height: 8 }]} />
          <Text style={s.catText}>{item.category || 'General'}</Text>
          <Text style={s.timeText}>{new Date(item.updatedAt ?? item.createdAt).toLocaleDateString()}</Text>
        </View>

        <View style={s.cardTitleRow}>
          <Text style={s.cardTitle} numberOfLines={1}>{getTitle(item)}</Text>
          {(item.wardenUnreadCount ?? 0) > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeTxt}>{item.wardenUnreadCount}</Text>
            </View>
          )}
        </View>

        <Text style={s.studentInfo}>
          {getStudentName(item)}{getStudentId(item) ? ` · ${getStudentId(item)}` : ''}
        </Text>

        {lastMsg?.content && (
          <Text style={s.lastMsg} numberOfLines={1}>{lastMsg.content}</Text>
        )}

        <View style={s.cardFooter}>
          <View style={s.statusRow}>
            {getStatusIcon(item.status)}
            <Text style={[s.statusLbl, { color }]}>{getStatusLabel(item.status)}</Text>
          </View>
          <View style={s.cardActions}>
            <TouchableOpacity
              style={s.cardDelBtn}
              onPress={() => handleDelete(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Trash2 size={15} color="#EF4444" />
            </TouchableOpacity>
            <View style={s.openRow}>
              <Text style={s.openTxt}>Open Chat</Text>
              <ChevronRight size={15} color={WARDEN_COLOR} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.headerContainer}>

        {/* Stats Row - Restored but Premium Styled */}
        <View style={s.statsRow}>
          {([
            { key: 'all',         label: 'Total',       color: Colors.roles.warden },
            { key: 'open',        label: 'Open',        color: '#EF4444' },
            { key: 'in-progress', label: 'In Progress', color: '#F59E0B' },
            { key: 'resolved',    label: 'Resolved',    color: '#10B981' },
          ] as const).map(({ key, label, color }) => (
            <TouchableOpacity
              key={key}
              style={[s.statBox, filter === key && { borderColor: color, borderWidth: 2 }]}
              onPress={() => setFilter(key)}
            >
              <Text style={[s.statVal, { color }]}>{counts[key]}</Text>
              <Text style={s.statLab}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

      <View style={s.sectionHeader}>
        <View>
          <Text style={s.sectionTitle}>Student Complaints</Text>
          <Text style={s.sectionSub}>Resolution Center & Chat</Text>
        </View>
      </View>

      <View style={[s.subHeaderRow, { borderTopWidth: 1, borderTopColor: Colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
          <View style={s.subTabGroup}>
            {(['all', 'open', 'in-progress', 'resolved'] as const).map(f => (
              <TouchableOpacity 
                key={f} 
                style={[s.miniTab, filter === f && s.miniTabActive]} 
                onPress={() => setFilter(f)}
              >
                <Text style={[s.miniTabText, filter === f && s.miniTabTextActive]}>
                  {f === 'all' ? 'All' : getStatusLabel(f)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

        {/* Search inside header group */}
        <View style={s.searchWrap}>
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by title, name or ID..."
            placeholderTextColor={Colors.textMuted}
          />
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={WARDEN_COLOR} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={s.list}
          refreshing={refreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <MessageSquare size={48} color={Colors.textMuted} />
              <Text style={s.emptyTxt}>No complaints found</Text>
              <Text style={s.emptySub}>Try adjusting your filters</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: Colors.background },
  flex:      { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Page header
  headerContainer: { backgroundColor: Colors.surface, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },

  // Stats
  statsRow:  { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: Colors.background, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, borderWidth: 1, borderColor: BORDER_COLOR },
  statVal: { fontSize: 18, fontWeight: '900' },
  statLab: { fontSize: 8, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', marginTop: 2, letterSpacing: 0.5 },

  // Filter
  sectionHeader: { paddingHorizontal: 20, marginTop: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
  sectionSub: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, marginTop: 2 },
  subHeaderRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 12 },
  subTabGroup: { flexDirection: 'row', backgroundColor: Colors.background, padding: 4, borderRadius: 12, gap: 4, margin: 16 },
  miniTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  miniTabActive: { backgroundColor: Colors.roles.warden, elevation: 2, shadowColor: Colors.roles.warden, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  miniTabText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  miniTabTextActive: { color: '#FFF' },

  // Search
  searchWrap:  { marginBottom: 0 },
  searchInput: { backgroundColor: Colors.background, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, fontWeight: '600', color: Colors.text, borderWidth: 1, borderColor: BORDER_COLOR, elevation: 1 },

  // List
  list: { paddingHorizontal: 20, paddingBottom: 100 },

  // Card
  card:        { backgroundColor: Colors.surface, borderRadius: 24, padding: 18, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  catText:     { flex: 1, fontSize: 11, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  timeText:    { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  cardTitleRow:{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle:   { flex: 1, fontSize: 16, fontWeight: '800', color: Colors.text },
  badge:       { minWidth: 20, height: 20, paddingHorizontal: 6, backgroundColor: '#EF4444', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badgeTxt:    { fontSize: 10, fontWeight: '900', color: '#fff' },
  studentInfo: { fontSize: 13, color: Colors.textMuted, fontWeight: '600', marginBottom: 6 },
  lastMsg:     { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', marginBottom: 14 },
  cardFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.background, paddingTop: 12 },
  statusRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusLbl:   { fontSize: 13, fontWeight: '800' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardDelBtn:  { width: 34, height: 34, borderRadius: 10, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  openRow:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
  openTxt:     { fontSize: 13, fontWeight: '700', color: WARDEN_COLOR },

  // Empty list
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 8 },
  emptyTxt:  { fontSize: 16, fontWeight: '800', color: Colors.textMuted },
  emptySub:  { fontSize: 13, color: Colors.textMuted },

  // ── Chat header ──
  chatHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER_COLOR, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, zIndex: 100 },
  iconBtn:      { width: 36, height: 36, borderRadius: 11, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  avatar:       { width: 36, height: 36, borderRadius: 11, backgroundColor: WARDEN_COLOR, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:    { fontSize: 14, fontWeight: '900', color: '#fff' },
  chatHeaderInfo:{ flex: 1, minWidth: 0 },
  chatTitle:    { fontSize: 13, fontWeight: '800', color: Colors.text },
  chatSub:      { fontSize: 11, color: Colors.textMuted, fontWeight: '600', marginTop: 1 },
  dot:          { width: 6, height: 6, borderRadius: 3 },

  // Status pill
  statusPill:       { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusPillTxt:    { fontSize: 10, fontWeight: '800' },
  statusMenu:       { position: 'absolute', right: 0, top: 42, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: BORDER_COLOR, zIndex: 1000, minWidth: 148, elevation: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 15 },
  statusMenuItem:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11 },
  statusMenuItemOn: { backgroundColor: Colors.background },
  statusMenuTxt:    { fontSize: 13, fontWeight: '700', color: Colors.text },

  // Messages
  msgContent:  { padding: 16, paddingBottom: 12, flexGrow: 1 },
  emptyChat:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 8 },
  emptyChatTitle: { fontSize: 16, fontWeight: '800', color: Colors.textMuted },
  emptyChatSub:   { fontSize: 13, color: Colors.textMuted },

  msgRow:  { marginBottom: 14 },
  msgRight:{ alignItems: 'flex-end' },
  msgLeft: { alignItems: 'flex-start' },

  bubble:  { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9 },
  bubbleW: { backgroundColor: WARDEN_COLOR, borderBottomRightRadius: 4 },
  bubbleS: { backgroundColor: Colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: BORDER_COLOR },

  msgTxt:  { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  msgTxtW: { color: '#fff' },
  msgTxtS: { color: Colors.text },

  meta:       { flexDirection: 'row', marginTop: 4 },
  metaR:      { justifyContent: 'flex-end' },
  metaL:      { justifyContent: 'flex-start' },
  metaSender: { fontSize: 10, fontWeight: '700', color: Colors.textMuted },
  metaTime:   { fontSize: 10, color: Colors.textMuted },

  msgImg:   { width: 210, height: 150, borderRadius: 12 },
  docRow:   { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 9, borderRadius: 11 },
  docRowW:  { backgroundColor: 'rgba(255,255,255,0.15)' },
  docRowS:  { backgroundColor: Colors.background, borderWidth: 1, borderColor: BORDER_COLOR },
  docIcon:  { width: 34, height: 34, borderRadius: 9, backgroundColor: WARDEN_COLOR + '20', alignItems: 'center', justifyContent: 'center' },
  docLabel: { fontSize: 13, fontWeight: '700', flex: 1 },

  // ── INPUT BAR — the key fix ──
  inputBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    paddingHorizontal: 12,
    paddingTop: 10,
    // Enough bottom padding so nothing overlaps the Android nav bar
    // and iOS home-indicator area. SafeAreaView already adds top,
    // so we only need to guard the bottom manually.
    paddingBottom: Platform.select({ ios: 8, android: 14 }),
  },

  fileStrip:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.background, borderRadius: 12, padding: 9, marginBottom: 8, borderWidth: 1, borderColor: BORDER_COLOR },
  fileStripThumb: { width: 38, height: 38, borderRadius: 9, backgroundColor: WARDEN_COLOR + '15', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  fileThumb:      { width: 38, height: 38, borderRadius: 9 },
  fileName:       { fontSize: 12, fontWeight: '700', color: Colors.text },
  fileSize:       { fontSize: 10, color: Colors.textMuted, marginTop: 2 },

  composeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',   // buttons stay at bottom when input grows
    gap: 8,
  },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    // Keeps the button vertically centred to the last line of the textarea
    alignSelf: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 22,
    // Symmetric vertical padding — critical for Android not to clip text
    paddingTop: Platform.select({ ios: 11, android: 10 }),
    paddingBottom: Platform.select({ ios: 11, android: 10 }),
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    maxHeight: 110,
    minHeight: 44,
    // Aligns text to top when multiline grows
    textAlignVertical: 'top',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: WARDEN_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    elevation: 3,
    shadowColor: WARDEN_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  sendBtnOff: { opacity: 0.38 },
});