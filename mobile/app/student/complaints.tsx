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
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Colors from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import {
  MessageSquare,
  Plus,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  ArrowLeft,
  Paperclip,
  FileText,
  ThumbsUp,
  RotateCcw,
  Smile,
  Trash2
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
  studentFeedback?: string;
  studentUnreadCount?: number;   // unread messages from warden
  wardenUnreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'resolved':    return '#10B981';
    case 'in-progress': return '#F59E0B';
    case 'open':        return '#EF4444';
    case 'pending':     return '#F59E0B';
    default:            return Colors.textMuted;
  }
};

const getStatusLabel = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'in-progress': return 'In Progress';
    case 'resolved':    return 'Resolved';
    case 'open':        return 'Open';
    case 'pending':     return 'Pending';
    default:            return status ?? 'Pending';
  }
};

const getTitle = (c: Complaint) => c.title || c.subject || 'Untitled';

const STUDENT_COLOR = (Colors.roles as any)?.student ?? '#8B5CF6';
const BORDER_COLOR  = (Colors as any).border ?? '#E2E8F0';

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudentComplaints() {
  const { user } = useAuthStore();

  // List state
  const [complaints, setComplaints]           = useState<Complaint[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [refreshing, setRefreshing]           = useState(false);

  // Chat state
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);
  const [chatView, setChatView]               = useState(false);
  const [chatLoading, setChatLoading]         = useState(false);

  // Message compose
  const [message, setMessage]                 = useState('');
  const [sending, setSending]                 = useState(false);
  const [selectedFile, setSelectedFile]       = useState<{
    uri: string; name: string; type: string; size?: number;
  } | null>(null);

  // Feedback
  const [feedbackGiven, setFeedbackGiven]     = useState<string | null>(null);
  const [sendingFeedback, setSendingFeedback] = useState(false);

  // New complaint modal
  const [showNewModal, setShowNewModal]       = useState(false);
  const [newTitle, setNewTitle]               = useState('');
  const [newDesc, setNewDesc]                 = useState('');
  const [newCategory, setNewCategory]         = useState('');
  const [submitting, setSubmitting]           = useState(false);

  // Delete
  const [deleting, setDeleting]               = useState(false);

  const scrollRef  = useRef<ScrollView>(null);
  const prevMsgLen = useRef(0);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchComplaints = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await api.get('/complaints/mine');
      const list: Complaint[] = Array.isArray(res.data)
        ? res.data : res.data?.data ?? [];
      setComplaints(list);
    } catch (err) {
      console.error('Fetch student complaints error:', err);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchComplaints(false);
    setRefreshing(false);
  };

  const fetchSingle = useCallback(async (id: string, showLoader = true) => {
    if (showLoader) setChatLoading(true);
    try {
      const res = await api.get(`/complaints/${id}`);
      const updated: Complaint = res.data?.data ?? res.data;
      setActiveComplaint(updated);
      if (updated.studentFeedback) setFeedbackGiven(updated.studentFeedback);
      // Zero out unread count locally as soon as student opens the chat
      setComplaints(prev =>
        prev.map(c => c._id === id ? { ...c, ...updated, studentUnreadCount: 0 } : c),
      );
      // Tell the backend the student has read the messages (fire-and-forget)
      api.patch(`/complaints/${id}/read-student`).catch(() => {});
    } catch (err) {
      console.error('Fetch single error:', err);
    } finally {
      if (showLoader) setChatLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
    const iv = setInterval(() => fetchComplaints(false), 5000);
    return () => clearInterval(iv);
  }, [fetchComplaints]);

  useEffect(() => {
    if (!chatView || !activeComplaint) return;
    const iv = setInterval(() => fetchSingle(activeComplaint._id, false), 3000);
    return () => clearInterval(iv);
  }, [chatView, activeComplaint?._id]);

  // Auto-scroll on new messages
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
    setFeedbackGiven(c.studentFeedback ?? null);
    setActiveComplaint(c);
    setChatView(true);
    await fetchSingle(c._id);
  };

  const closeChat = () => {
    setChatView(false);
    setActiveComplaint(null);
    setMessage('');
    setSelectedFile(null);
    setFeedbackGiven(null);
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
      setSelectedFile({
        uri:  a.uri,
        name: a.fileName ?? `photo_${Date.now()}.jpg`,
        type: a.mimeType ?? 'image/jpeg',
      });
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
      if (a.size && a.size > 10 * 1024 * 1024) {
        Alert.alert('File too large', 'Max 10 MB.'); return;
      }
      setSelectedFile({
        uri:  a.uri,
        name: a.name,
        type: a.mimeType ?? 'application/octet-stream',
        size: a.size,
      });
    }
  };

  const showAttachMenu = () =>
    Alert.alert('Attach File', 'Choose type', [
      { text: 'Photo / Image',         onPress: pickImage    },
      { text: 'Document (PDF / Word)', onPress: pickDocument },
      { text: 'Cancel', style: 'cancel' },
    ]);

  // ── Send message ──────────────────────────────────────────────────────────

  const sendMessage = async () => {
    if (!activeComplaint || sending || (!message.trim() && !selectedFile)) return;
    setSending(true);
    try {
      const fd = new FormData();
      if (message.trim()) fd.append('content', message.trim());
      if (selectedFile) {
        fd.append('file', {
          uri:  selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.type,
        } as any);
      }
      const res = await api.post(
        `/complaints/${activeComplaint._id}/message-student`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      const updated: Complaint = res.data?.data ?? res.data;
      setActiveComplaint(updated);
      setComplaints(prev =>
        prev.map(c => c._id === activeComplaint._id ? { ...c, ...updated } : c),
      );
      setMessage('');
      setSelectedFile(null);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // ── Feedback ──────────────────────────────────────────────────────────────

  const sendFeedback = async (type: string) => {
    if (!activeComplaint || sendingFeedback) return;
    setSendingFeedback(true);
    try {
      const res = await api.patch(`/complaints/${activeComplaint._id}/feedback`, { feedback: type });
      const updated: Complaint = res.data?.data ?? res.data;
      setActiveComplaint(updated);
      setFeedbackGiven(type);
      setComplaints(prev =>
        prev.map(c => c._id === activeComplaint._id ? { ...c, ...updated } : c),
      );
      if (type === 'not-resolved') {
        Alert.alert('Reopened', 'Complaint reopened — warden has been notified.');
      } else {
        Alert.alert('Thank you!', 'Glad the issue was resolved 🎉');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send feedback');
    } finally {
      setSendingFeedback(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = (c: Complaint) =>
    Alert.alert('Delete Complaint', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setDeleting(true);
        try {
          await api.delete(`/complaints/${c._id}`);
          setComplaints(prev => prev.filter(x => x._id !== c._id));
          if (chatView) closeChat();
        } catch (err: any) {
          Alert.alert('Error', err.response?.data?.message || 'Failed to delete');
        } finally { setDeleting(false); }
      }},
    ]);

  // ── Submit new complaint ──────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!newTitle.trim() || !newDesc.trim()) {
      Alert.alert('Error', 'Please fill in all fields'); return;
    }
    setSubmitting(true);
    try {
      await api.post('/complaints', {
        title: newTitle.trim(),
        description: newDesc.trim(),
        ...(newCategory.trim() && { category: newCategory.trim() }),
      });
      Alert.alert('Success', 'Complaint submitted successfully');
      setShowNewModal(false);
      setNewTitle(''); setNewDesc(''); setNewCategory('');
      fetchComplaints();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAT VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  if (chatView && activeComplaint) {
    const isResolved = activeComplaint.status === 'resolved';
    const canSend    = (message.trim().length > 0 || !!selectedFile) && !sending && !isResolved;
    const msgCount   = activeComplaint.messages?.length ?? 0;

    return (
      <SafeAreaView style={s.safeArea}>
        <KeyboardAvoidingView
          style={s.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* ── Header ── */}
          <View style={s.chatHeader}>
            <TouchableOpacity style={s.iconBtn} onPress={closeChat}>
              <ArrowLeft size={20} color={Colors.text} />
            </TouchableOpacity>

            <View style={s.flex}>
              <Text style={s.chatTitle} numberOfLines={1}>{getTitle(activeComplaint)}</Text>
              <View style={s.chatSubRow}>
                <View style={[s.statusPill, { backgroundColor: getStatusColor(activeComplaint.status) + '20' }]}>
                  <View style={[s.dot, { backgroundColor: getStatusColor(activeComplaint.status) }]} />
                  <Text style={[s.statusPillTxt, { color: getStatusColor(activeComplaint.status) }]}>
                    {getStatusLabel(activeComplaint.status)}
                  </Text>
                </View>
                <Text style={s.ticketTxt}>
                  #{activeComplaint._id.slice(-6).toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={s.chatHeaderRight}>
              <View style={s.wardenOnline}>
                <Text style={s.wardenLabel}>Warden</Text>
                <Text style={s.wardenOnlineDot}>● Online</Text>
              </View>
              <TouchableOpacity
                style={[s.iconBtn, { backgroundColor: '#FEF2F2' }]}
                onPress={() => handleDelete(activeComplaint)}
                disabled={deleting}
              >
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Messages ── */}
          <Pressable style={s.flex}>
            {chatLoading ? (
              <View style={s.centered}>
                <ActivityIndicator size="large" color={STUDENT_COLOR} />
              </View>
            ) : (
              <ScrollView
                ref={scrollRef}
                style={s.flex}
                contentContainerStyle={s.msgContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Original description card */}
                <View style={s.descCard}>
                  <View style={s.descCardHeader}>
                    <Clock size={12} color={STUDENT_COLOR} />
                    <Text style={[s.descCardLabel, { color: STUDENT_COLOR }]}>TICKET OPENED</Text>
                  </View>
                  <Text style={s.descCardText}>{activeComplaint.description}</Text>
                </View>

                {/* Messages */}
                {msgCount === 0 && (
                  <View style={s.emptyChat}>
                    <MessageSquare size={36} color={Colors.textMuted} />
                    <Text style={s.emptyChatTxt}>No replies yet</Text>
                    <Text style={s.emptyChatSub}>The warden will respond soon</Text>
                  </View>
                )}

                {activeComplaint.messages?.map((msg, idx) => {
                  const isMe = msg.senderRole === 'student';
                  return (
                    <View key={msg._id ?? idx} style={[s.msgRow, isMe ? s.msgRight : s.msgLeft]}>
                      <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleWarden]}>
                        {/* File attachment */}
                        {msg.fileUrl && (
                          <View style={{ marginBottom: msg.content ? 8 : 0 }}>
                            {msg.fileType === 'image' ? (
                              <Image
                                source={{ uri: msg.fileUrl }}
                                style={s.msgImg}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={[s.docRow, isMe ? s.docRowMe : s.docRowWarden]}>
                                <View style={s.docIcon}>
                                  <FileText size={18} color={isMe ? '#fff' : STUDENT_COLOR} />
                                </View>
                                <Text style={[s.docLabel, { color: isMe ? '#fff' : Colors.text }]}>
                                  View Document
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                        {!!msg.content && (
                          <Text style={[s.msgTxt, isMe ? s.msgTxtMe : s.msgTxtWarden]}>
                            {msg.content}
                          </Text>
                        )}
                      </View>
                      <View style={[s.meta, isMe ? s.metaR : s.metaL]}>
                        <Text style={s.metaSender}>{isMe ? 'You' : 'Hostel Warden'}</Text>
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

          {/* ── Bottom bar ── */}
          {isResolved ? (
            /* Feedback bar */
            <View style={s.feedbackBar}>
              {feedbackGiven ? (
                /* Post-feedback confirmation */
                <View style={s.feedbackDone}>
                  {feedbackGiven === 'great' ? (
                    <>
                      <View style={[s.feedbackIcon, { backgroundColor: '#D1FAE5' }]}>
                        <Smile size={22} color="#10B981" />
                      </View>
                      <View>
                        <Text style={[s.feedbackDoneTitle, { color: '#065F46' }]}>Thank you for your feedback! 🎉</Text>
                        <Text style={s.feedbackDoneSub}>We're glad the issue was resolved.</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={[s.feedbackIcon, { backgroundColor: '#FEF3C7' }]}>
                        <RotateCcw size={22} color="#D97706" />
                      </View>
                      <View>
                        <Text style={[s.feedbackDoneTitle, { color: '#92400E' }]}>Complaint Reopened</Text>
                        <Text style={s.feedbackDoneSub}>Warden has been notified to assist you further.</Text>
                      </View>
                    </>
                  )}
                </View>
              ) : (
                /* Feedback prompt */
                <View style={s.feedbackPrompt}>
                  <View style={s.feedbackPromptHeader}>
                    <View style={[s.feedbackIcon, { backgroundColor: '#D1FAE5' }]}>
                      <CheckCircle size={18} color="#10B981" />
                    </View>
                    <View>
                      <Text style={s.feedbackPromptTitle}>Warden marked this as Resolved</Text>
                      <Text style={s.feedbackPromptSub}>Was your issue actually resolved?</Text>
                    </View>
                  </View>
                  <View style={s.feedbackBtns}>
                    <TouchableOpacity
                      style={[s.feedbackBtn, s.feedbackBtnYes]}
                      onPress={() => sendFeedback('great')}
                      disabled={sendingFeedback}
                    >
                      <ThumbsUp size={17} color="#fff" />
                      <Text style={s.feedbackBtnYesTxt}>
                        {sendingFeedback ? 'Sending…' : 'Great! Resolved'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.feedbackBtn, s.feedbackBtnNo]}
                      onPress={() => sendFeedback('not-resolved')}
                      disabled={sendingFeedback}
                    >
                      <AlertCircle size={17} color="#DC2626" />
                      <Text style={s.feedbackBtnNoTxt}>
                        {sendingFeedback ? 'Sending…' : 'Not Resolved'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ) : (
            /* Normal input bar */
            <View style={s.inputBar}>
              {/* File preview */}
              {selectedFile && (
                <View style={s.fileStrip}>
                  <View style={s.fileStripThumb}>
                    {selectedFile.type.startsWith('image/')
                      ? <Image source={{ uri: selectedFile.uri }} style={s.fileThumb} />
                      : <FileText size={20} color={STUDENT_COLOR} />}
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

              <View style={s.composeRow}>
                <TouchableOpacity style={s.attachBtn} onPress={showAttachMenu}>
                  <Paperclip size={20} color={Colors.textMuted} />
                </TouchableOpacity>

                <TextInput
                  style={s.textInput}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Type your message..."
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
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  const renderItem = ({ item }: { item: Complaint }) => {
    const color    = getStatusColor(item.status);
    const lastMsg  = item.messages?.[item.messages.length - 1];
    const msgCount = item.messages?.length ?? 0;

    return (
      <TouchableOpacity style={s.card} onPress={() => openChat(item)} activeOpacity={0.85}>
        <View style={s.cardHeader}>
          <View style={[s.dot, { backgroundColor: color, width: 8, height: 8 }]} />
          <Text style={s.catText}>{item.category || 'General'}</Text>
          <Text style={s.timeText}>
            {new Date(item.updatedAt ?? item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Title + unread badge */}
        <View style={s.cardTitleRow}>
          <Text style={s.cardTitle} numberOfLines={1}>{getTitle(item)}</Text>
          {(item.studentUnreadCount ?? 0) > 0 && (
            <View style={s.unreadBadge}>
              <Text style={s.unreadBadgeTxt}>{item.studentUnreadCount}</Text>
            </View>
          )}
        </View>

        {item.description && (
          <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>
        )}

        {/* Last message — highlighted when unread warden reply exists */}
        {lastMsg?.content && (
          <View style={s.lastMsgRow}>
            <MessageSquare
              size={11}
              color={
                lastMsg.senderRole === 'warden' && (item.studentUnreadCount ?? 0) > 0
                  ? STUDENT_COLOR
                  : Colors.textMuted
              }
            />
            <Text
              style={[
                s.lastMsgTxt,
                lastMsg.senderRole === 'warden' && (item.studentUnreadCount ?? 0) > 0
                  && s.lastMsgTxtUnread,
              ]}
              numberOfLines={1}
            >
              {lastMsg.senderRole === 'warden' ? 'Warden: ' : 'You: '}{lastMsg.content}
            </Text>
          </View>
        )}

        <View style={s.cardFooter}>
          <View style={[s.statusBadge, { backgroundColor: color + '15' }]}>
            {item.status === 'resolved'
              ? <CheckCircle size={12} color={color} />
              : item.status === 'in-progress'
                ? <Clock size={12} color={color} />
                : <AlertCircle size={12} color={color} />}
            <Text style={[s.statusBadgeTxt, { color }]}>{getStatusLabel(item.status)}</Text>
          </View>

          <View style={s.cardRight}>
            {msgCount > 0 && (
              <View style={s.msgCountBadge}>
                <Text style={s.msgCountTxt}>{msgCount} msg{msgCount !== 1 ? 's' : ''}</Text>
              </View>
            )}
            <TouchableOpacity
              style={s.cardDelBtn}
              onPress={() => handleDelete(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Trash2 size={14} color="#EF4444" />
            </TouchableOpacity>
            <View style={s.openRow}>
              <Text style={s.openTxt}>View Chat</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>

      {/* ── List ── */}
      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={STUDENT_COLOR} />
        </View>
      ) : (
        <FlatList
          data={complaints}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={s.list}
          refreshing={refreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <MessageSquare size={48} color={Colors.textMuted} />
              <Text style={s.emptyTxt}>No grievances recorded</Text>
              <Text style={s.emptySub}>Tap + to submit a new complaint</Text>
            </View>
          }
        />
      )}

      {/* ── FAB ── */}
      <TouchableOpacity style={s.fab} onPress={() => setShowNewModal(true)} activeOpacity={0.85}>
        <Plus size={26} color="#fff" />
      </TouchableOpacity>

      {/* ── New Complaint Modal ── */}
      <Modal
        visible={showNewModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNewModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalSheet}>
              {/* Modal header */}
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>New Complaint</Text>
                <TouchableOpacity style={s.modalCloseBtn} onPress={() => setShowNewModal(false)}>
                  <X size={22} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Title */}
                <Text style={s.fieldLabel}>Title *</Text>
                <TextInput
                  style={s.fieldInput}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="Subject of your complaint"
                  placeholderTextColor={Colors.textMuted}
                />

                {/* Category */}
                <Text style={[s.fieldLabel, { marginTop: 20 }]}>Category (optional)</Text>
                <TextInput
                  style={s.fieldInput}
                  value={newCategory}
                  onChangeText={setNewCategory}
                  placeholder="e.g. Maintenance, Food, Security..."
                  placeholderTextColor={Colors.textMuted}
                />

                {/* Description */}
                <Text style={[s.fieldLabel, { marginTop: 20 }]}>Description *</Text>
                <TextInput
                  style={[s.fieldInput, s.fieldTextArea]}
                  value={newDesc}
                  onChangeText={setNewDesc}
                  placeholder="Describe the issue in detail..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />

                {/* Submit */}
                <TouchableOpacity
                  style={[s.submitBtn, submitting && { opacity: 0.6 }]}
                  onPress={handleSubmit}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  {submitting
                    ? <ActivityIndicator color="#fff" />
                    : <>
                        <Send size={18} color="#fff" />
                        <Text style={s.submitTxt}>Submit Grievance</Text>
                      </>}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: Colors.background },
  flex:      { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dot:       { width: 6, height: 6, borderRadius: 3 },

  // ── Page header ──
  headerContainer: { backgroundColor: Colors.surface, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },

  // ── List ──
  list: { paddingHorizontal: 20, paddingBottom: 120 },

  // ── Card ──
  card: {
    backgroundColor: Colors.surface, borderRadius: 24,
    padding: 18, marginBottom: 14,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6,
  },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  catText:      { flex: 1, fontSize: 11, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  timeText:     { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  // Title row with unread badge
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  cardTitle:    { flex: 1, fontSize: 16, fontWeight: '800', color: Colors.text },
  unreadBadge:  {
    minWidth: 22, height: 22, paddingHorizontal: 6,
    backgroundColor: STUDENT_COLOR,
    borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    elevation: 2, shadowColor: STUDENT_COLOR,
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.4, shadowRadius: 4,
  },
  unreadBadgeTxt: { fontSize: 11, fontWeight: '900', color: '#fff' },
  cardDesc:     { fontSize: 13, color: Colors.textMuted, lineHeight: 19, marginBottom: 10 },
  lastMsgRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
  lastMsgTxt:       { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', flex: 1 },
  lastMsgTxtUnread: { color: Colors.text, fontStyle: 'normal', fontWeight: '700' },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: Colors.background, paddingTop: 12,
  },
  statusBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeTxt: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  cardRight:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  msgCountBadge:  { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: STUDENT_COLOR + '15', borderRadius: 8 },
  msgCountTxt:    { fontSize: 10, fontWeight: '700', color: STUDENT_COLOR },
  cardDelBtn:     { width: 30, height: 30, borderRadius: 8, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  openRow:        { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: STUDENT_COLOR + '12', borderRadius: 8 },
  openTxt:        { fontSize: 11, fontWeight: '800', color: STUDENT_COLOR },

  // ── Empty ──
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 8 },
  emptyTxt:  { fontSize: 16, fontWeight: '800', color: Colors.textMuted },
  emptySub:  { fontSize: 13, color: Colors.textMuted },

  // ── FAB ──
  fab: {
    position: 'absolute', bottom: 32, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: STUDENT_COLOR,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: STUDENT_COLOR,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10,
  },

  // ── New Complaint Modal ──
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    maxHeight: '92%',
  },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  modalTitle:    { fontSize: 20, fontWeight: '900', color: Colors.text },
  modalCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  fieldLabel:    { fontSize: 12, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  fieldInput: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16, paddingVertical: 13,
    borderRadius: 16, borderWidth: 1, borderColor: BORDER_COLOR,
    fontSize: 15, fontWeight: '600', color: Colors.text,
  },
  fieldTextArea: { height: 120, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: STUDENT_COLOR,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 18, borderRadius: 20, marginTop: 32, gap: 10,
  },
  submitTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // ═══════════════════════════════════════
  // CHAT VIEW
  // ═══════════════════════════════════════

  // ── Chat header ──
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER_COLOR,
    elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4,
  },
  iconBtn:       { width: 36, height: 36, borderRadius: 11, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  chatTitle:     { fontSize: 14, fontWeight: '800', color: Colors.text },
  chatSubRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  statusPill:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusPillTxt: { fontSize: 10, fontWeight: '800' },
  ticketTxt:     { fontSize: 10, fontWeight: '700', color: Colors.textMuted },
  chatHeaderRight:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  wardenOnline:  { alignItems: 'flex-end' },
  wardenLabel:   { fontSize: 11, fontWeight: '700', color: Colors.text },
  wardenOnlineDot:{ fontSize: 10, fontWeight: '700', color: '#10B981', marginTop: 1 },

  // ── Messages ──
  msgContent: { padding: 16, paddingBottom: 16, flexGrow: 1 },

  // Description card
  descCard: {
    backgroundColor: STUDENT_COLOR + '10',
    borderRadius: 20, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: STUDENT_COLOR + '20',
  },
  descCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  descCardLabel:  { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  descCardText:   { fontSize: 14, fontWeight: '500', color: Colors.text, lineHeight: 21 },

  emptyChat:    { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyChatTxt: { fontSize: 15, fontWeight: '800', color: Colors.textMuted },
  emptyChatSub: { fontSize: 12, color: Colors.textMuted },

  msgRow:  { marginBottom: 14 },
  msgRight:{ alignItems: 'flex-end' },
  msgLeft: { alignItems: 'flex-start' },

  bubble:       { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe:     { backgroundColor: '#1E293B', borderBottomRightRadius: 4 },
  bubbleWarden: { backgroundColor: Colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: BORDER_COLOR },

  msgTxt:       { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  msgTxtMe:     { color: '#fff' },
  msgTxtWarden: { color: Colors.text },

  meta:       { flexDirection: 'row', marginTop: 4 },
  metaR:      { justifyContent: 'flex-end' },
  metaL:      { justifyContent: 'flex-start' },
  metaSender: { fontSize: 10, fontWeight: '700', color: Colors.textMuted },
  metaTime:   { fontSize: 10, color: Colors.textMuted },

  msgImg:      { width: 210, height: 150, borderRadius: 12 },
  docRow:      { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 9, borderRadius: 11 },
  docRowMe:    { backgroundColor: 'rgba(255,255,255,0.15)' },
  docRowWarden:{ backgroundColor: Colors.background, borderWidth: 1, borderColor: BORDER_COLOR },
  docIcon:     { width: 34, height: 34, borderRadius: 9, backgroundColor: STUDENT_COLOR + '20', alignItems: 'center', justifyContent: 'center' },
  docLabel:    { fontSize: 13, fontWeight: '700', flex: 1 },

  // ── Feedback bar ──
  feedbackBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: BORDER_COLOR,
    paddingBottom: Platform.select({ ios: 28, android: 16 }),
  },
  feedbackDone: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 20,
  },
  feedbackIcon:      { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  feedbackDoneTitle: { fontSize: 14, fontWeight: '800' },
  feedbackDoneSub:   { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  feedbackPrompt:    { padding: 16 },
  feedbackPromptHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  feedbackPromptTitle:  { fontSize: 13, fontWeight: '800', color: Colors.text },
  feedbackPromptSub:    { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  feedbackBtns: { flexDirection: 'row', gap: 10 },
  feedbackBtn:  {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 16, gap: 7,
  },
  feedbackBtnYes:    { backgroundColor: '#10B981' },
  feedbackBtnYesTxt: { fontSize: 13, fontWeight: '800', color: '#fff' },
  feedbackBtnNo:     { backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#FECACA' },
  feedbackBtnNoTxt:  { fontSize: 13, fontWeight: '800', color: '#DC2626' },

  // ── Input bar ──
  inputBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: BORDER_COLOR,
    paddingHorizontal: 12, paddingTop: 10,
    paddingBottom: Platform.select({ ios: 8, android: 14 }),
  },
  fileStrip:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.background, borderRadius: 12, padding: 9, marginBottom: 8, borderWidth: 1, borderColor: BORDER_COLOR },
  fileStripThumb: { width: 38, height: 38, borderRadius: 9, backgroundColor: STUDENT_COLOR + '15', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  fileThumb:      { width: 38, height: 38, borderRadius: 9 },
  fileName:       { fontSize: 12, fontWeight: '700', color: Colors.text },
  fileSize:       { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  composeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  attachBtn: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: Colors.background,
    borderWidth: 1, borderColor: BORDER_COLOR,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 22,
    paddingTop:    Platform.select({ ios: 11, android: 10 }),
    paddingBottom: Platform.select({ ios: 11, android: 10 }),
    paddingHorizontal: 16,
    fontSize: 14, fontWeight: '500', color: Colors.text,
    borderWidth: 1, borderColor: BORDER_COLOR,
    maxHeight: 110, minHeight: 44,
    textAlignVertical: 'top',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: STUDENT_COLOR,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-end',
    elevation: 3, shadowColor: STUDENT_COLOR,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 6,
  },
  sendBtnOff: { opacity: 0.35 },
});