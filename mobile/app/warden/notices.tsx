import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Colors from '../../constants/Colors';
import {
  Bell,
  Megaphone,
  Calendar,
  Plus,
  X,
  Send,
  Trash2,
  ArrowLeft,
  Edit3,
  Paperclip,
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
} from 'lucide-react-native';
import api from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Attachment {
  url: string;
  type: 'image' | 'document' | string;
  publicId?: string;
}

interface Notice {
  _id: string;
  title: string;
  content: string;
  attachments?: Attachment[];
  attachmentUrl?: string;
  attachmentType?: string;
  createdBy?: { name?: string; role?: string };
  createdAt: string;
}

interface NewFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
  isImage: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizeAttachments = (notice: Partial<Notice>): Attachment[] => {
  if (notice.attachments && notice.attachments.length > 0) return notice.attachments;
  if (notice.attachmentUrl)
    return [{ url: notice.attachmentUrl, type: notice.attachmentType ?? 'image' }];
  return [];
};

const WARDEN_COLOR = (Colors.roles as any)?.warden ?? '#6366F1';
const BORDER_COLOR = (Colors as any).border ?? '#E2E8F0';
const { width: SCREEN_W } = Dimensions.get('window');

// ─── Mini Slideshow (card thumbnail) ─────────────────────────────────────────

function MiniSlideshow({ attachments }: { attachments: Attachment[] }) {
  const images = attachments.filter(a => a.type === 'image');
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (images.length <= 1) return;
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % images.length), 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <View style={ss.slideWrap}>
      <Image source={{ uri: images[idx].url }} style={ss.slideImg} resizeMode="cover" />
      {images.length > 1 && (
        <View style={ss.dotRow}>
          {images.map((_, i) => (
            <View key={i} style={[ss.dot, i === idx ? ss.dotActive : ss.dotInactive]} />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Full-screen Image Carousel (detail view) ────────────────────────────────

function ImageCarousel({
  images,
  initialIndex,
  onClose,
}: {
  images: Attachment[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={ss.lightbox}>
        {/* Close */}
        <TouchableOpacity style={ss.lightboxClose} onPress={onClose}>
          <X size={22} color="#fff" />
        </TouchableOpacity>
        {/* Counter */}
        <Text style={ss.lightboxCounter}>{idx + 1} / {images.length}</Text>
        {/* Image */}
        <Image
          source={{ uri: images[idx].url }}
          style={ss.lightboxImg}
          resizeMode="contain"
        />
        {/* Arrows */}
        {images.length > 1 && (
          <>
            <TouchableOpacity style={[ss.lightboxArrow, { left: 16 }]} onPress={prev}>
              <ChevronLeft size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[ss.lightboxArrow, { right: 16 }]} onPress={next}>
              <ChevronRight size={28} color="#fff" />
            </TouchableOpacity>
            <View style={ss.lightboxDots}>
              {images.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => setIdx(i)}>
                  <View style={[ss.dot, i === idx ? ss.dotActive : ss.dotInactive]} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

// ─── Inline Detail Carousel ───────────────────────────────────────────────────

function DetailCarousel({
  images,
  onOpenLightbox,
}: {
  images: Attachment[];
  onOpenLightbox: (i: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);

  return (
    <View style={ss.detailCarousel}>
      <TouchableOpacity activeOpacity={0.92} onPress={() => onOpenLightbox(idx)}>
        <Image source={{ uri: images[idx].url }} style={ss.detailImg} resizeMode="cover" />
        {/* Expand hint */}
        <View style={ss.expandHint}>
          <ZoomIn size={12} color="#fff" />
          <Text style={ss.expandHintTxt}>Tap to expand</Text>
        </View>
      </TouchableOpacity>

      {images.length > 1 && (
        <>
          <TouchableOpacity style={[ss.carouselArrow, { left: 10 }]} onPress={prev}>
            <ChevronLeft size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[ss.carouselArrow, { right: 10 }]} onPress={next}>
            <ChevronRight size={22} color="#fff" />
          </TouchableOpacity>
          <View style={ss.carouselCounter}>
            <Text style={ss.carouselCounterTxt}>{idx + 1}/{images.length}</Text>
          </View>
          <View style={[ss.dotRow, { bottom: 10 }]}>
            {images.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setIdx(i)}>
                <View style={[ss.dot, i === idx ? ss.dotActive : ss.dotInactive]} />
              </TouchableOpacity>
            ))}
          </View>
          {/* Thumbnail strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={ss.thumbStrip}
            contentContainerStyle={{ gap: 6, paddingHorizontal: 12 }}
          >
            {images.map((img, i) => (
              <TouchableOpacity key={i} onPress={() => setIdx(i)}>
                <Image
                  source={{ uri: img.url }}
                  style={[ss.thumb, i === idx && ss.thumbActive]}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────

function NoticeFormModal({
  notice,
  onClose,
  onSaved,
}: {
  notice: Notice | null;
  onClose: () => void;
  onSaved: (n: Notice) => void;
}) {
  const isEdit = !!notice;
  const [title, setTitle]                         = useState(notice?.title ?? '');
  const [content, setContent]                     = useState(notice?.content ?? '');
  const [existingAtts, setExistingAtts]           = useState<Attachment[]>(
    notice ? normalizeAttachments(notice) : [],
  );
  const [newFiles, setNewFiles]                   = useState<NewFile[]>([]);
  const [submitting, setSubmitting]               = useState(false);

  const totalCount = existingAtts.length + newFiles.length;

  // ── File picking ────────────────────────────────────────────────────────

  const pickImages = async () => {
    if (totalCount >= 5) { Alert.alert('Limit reached', 'Maximum 5 attachments.'); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (!result.canceled) {
      const remaining = 5 - totalCount;
      const picked = result.assets.slice(0, remaining).map(a => ({
        uri:     a.uri,
        name:    a.fileName ?? `photo_${Date.now()}.jpg`,
        type:    a.mimeType ?? 'image/jpeg',
        isImage: true,
      }));
      setNewFiles(prev => [...prev, ...picked]);
    }
  };

  const pickDocument = async () => {
    if (totalCount >= 5) { Alert.alert('Limit reached', 'Maximum 5 attachments.'); return; }
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf','application/msword',
             'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const a = result.assets[0];
      setNewFiles(prev => [...prev, {
        uri: a.uri, name: a.name,
        type: a.mimeType ?? 'application/octet-stream',
        size: a.size, isImage: false,
      }]);
    }
  };

  const showAttachMenu = () =>
    Alert.alert('Add Attachment', `${totalCount}/5 used`, [
      { text: 'Photo(s) from Gallery', onPress: pickImages    },
      { text: 'Document (PDF/Word)',   onPress: pickDocument  },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const removeNewFile = (i: number) =>
    setNewFiles(prev => prev.filter((_, j) => j !== i));

  const removeExisting = async (i: number) => {
    if (!isEdit || !notice) return;
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('content', content);
      fd.append('removeIndex', String(i));
      const res = await api.patch(`/notices/${notice._id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updated: Notice = res.data?.data ?? res.data;
      setExistingAtts(normalizeAttachments(updated));
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to remove image');
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Title and content are required.'); return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('content', content.trim());
      newFiles.forEach(f => fd.append('attachments', { uri: f.uri, name: f.name, type: f.type } as any));

      let res;
      if (isEdit && notice) {
        res = await api.patch(`/notices/${notice._id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await api.post('/notices', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      const saved: Notice = res.data?.data ?? res.data;
      Alert.alert('Success', isEdit ? 'Notice updated!' : 'Notice published!');
      onSaved(saved);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save notice.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={ss.modalOverlay}>
          <View style={ss.modalSheet}>
            {/* Top accent bar */}
            <View style={ss.modalAccentBar} />

            {/* Header */}
            <View style={ss.modalHeader}>
              <Text style={ss.modalTitle}>{isEdit ? 'Edit Notice' : 'New Announcement'}</Text>
              <TouchableOpacity style={ss.modalCloseBtn} onPress={onClose}>
                <X size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {/* Title */}
              <Text style={ss.fieldLabel}>Title *</Text>
              <TextInput
                style={ss.fieldInput}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Maintenance Scheduled for Wing A"
                placeholderTextColor={Colors.textMuted}
              />

              {/* Content */}
              <Text style={[ss.fieldLabel, { marginTop: 20 }]}>Content *</Text>
              <TextInput
                style={[ss.fieldInput, ss.fieldTextArea]}
                value={content}
                onChangeText={setContent}
                placeholder="Detailed description of the announcement..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              {/* Existing attachments */}
              {existingAtts.length > 0 && (
                <>
                  <Text style={[ss.fieldLabel, { marginTop: 20 }]}>Current Photos</Text>
                  <View style={ss.attachGrid}>
                    {existingAtts.map((att, i) => (
                      <View key={i} style={ss.attachThumbWrap}>
                        {att.type === 'image' ? (
                          <Image source={{ uri: att.url }} style={ss.attachThumb} resizeMode="cover" />
                        ) : (
                          <View style={[ss.attachThumb, ss.attachDocThumb]}>
                            <FileText size={24} color={WARDEN_COLOR} />
                          </View>
                        )}
                        <TouchableOpacity style={ss.attachRemoveBtn} onPress={() => removeExisting(i)}>
                          <X size={12} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* New files preview */}
              {newFiles.length > 0 && (
                <>
                  <Text style={[ss.fieldLabel, { marginTop: 20 }]}>New Files to Upload</Text>
                  <View style={ss.attachGrid}>
                    {newFiles.map((f, i) => (
                      <View key={i} style={ss.attachThumbWrap}>
                        {f.isImage ? (
                          <Image source={{ uri: f.uri }} style={ss.attachThumb} resizeMode="cover" />
                        ) : (
                          <View style={[ss.attachThumb, ss.attachDocThumb]}>
                            <FileText size={24} color={WARDEN_COLOR} />
                            <Text style={ss.attachDocName} numberOfLines={2}>{f.name}</Text>
                          </View>
                        )}
                        <TouchableOpacity style={ss.attachRemoveBtn} onPress={() => removeNewFile(i)}>
                          <X size={12} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Add attachment button */}
              {totalCount < 5 && (
                <TouchableOpacity style={ss.addAttachBtn} onPress={showAttachMenu}>
                  <Paperclip size={18} color={WARDEN_COLOR} />
                  <Text style={ss.addAttachTxt}>
                    Add Photos / Document {totalCount > 0 ? `(${totalCount}/5)` : '(optional, up to 5)'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Submit */}
              <TouchableOpacity
                style={[ss.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <Send size={18} color="#fff" />
                      <Text style={ss.submitTxt}>{isEdit ? 'Save Changes' : 'Broadcast Now'}</Text>
                    </>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WardenNotices() {
  const [notices, setNotices]               = useState<Notice[]>([]);
  const [loading, setLoading]               = useState(true);

  // Detail view
  const [activeNotice, setActiveNotice]     = useState<Notice | null>(null);
  const [detailView, setDetailView]         = useState(false);
  const [lightboxIdx, setLightboxIdx]       = useState<number | null>(null);

  // Create / Edit modal
  const [formOpen, setFormOpen]             = useState(false);
  const [editingNotice, setEditingNotice]   = useState<Notice | null>(null);

  const [deleting, setDeleting]             = useState(false);

  // ── Fetch ───────────────────────────────────────────────────────────────

  const fetchNotices = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await api.get('/notices');
      const list: Notice[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setNotices(list);
    } catch (err) {
      console.error('Fetch notices error:', err);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const openDetail = (notice: Notice) => {
    setActiveNotice(notice);
    setDetailView(true);
  };

  const closeDetail = () => {
    setDetailView(false);
    setActiveNotice(null);
    setLightboxIdx(null);
  };

  const openCreate = () => { setEditingNotice(null); setFormOpen(true); };

  const openEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setFormOpen(true);
    if (detailView) closeDetail();
  };

  const handleSaved = (saved: Notice) => {
    setNotices(prev => {
      const exists = prev.find(n => n._id === saved._id);
      return exists
        ? prev.map(n => n._id === saved._id ? saved : n)
        : [saved, ...prev];
    });
  };

  const handleDelete = (notice: Notice) =>
    Alert.alert('Delete Notice', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setDeleting(true);
        try {
          await api.delete(`/notices/${notice._id}`);
          setNotices(prev => prev.filter(n => n._id !== notice._id));
          if (detailView) closeDetail();
        } catch (err: any) {
          Alert.alert('Error', err.response?.data?.message || 'Failed to delete');
        } finally { setDeleting(false); }
      }},
    ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // DETAIL VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  if (detailView && activeNotice) {
    const atts   = normalizeAttachments(activeNotice);
    const images = atts.filter(a => a.type === 'image');
    const docs   = atts.filter(a => a.type !== 'image');

    return (
      <SafeAreaView style={ss.safeArea}>
        {/* Lightbox */}
        {lightboxIdx !== null && (
          <ImageCarousel
            images={images}
            initialIndex={lightboxIdx}
            onClose={() => setLightboxIdx(null)}
          />
        )}

        {/* Header */}
        <View style={ss.detailHeader}>
          <TouchableOpacity style={ss.iconBtn} onPress={closeDetail}>
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={ss.detailHeaderTitle} numberOfLines={1}>{activeNotice.title}</Text>
          <TouchableOpacity
            style={[ss.iconBtn, { backgroundColor: '#EEF2FF' }]}
            onPress={() => openEdit(activeNotice)}
          >
            <Edit3 size={17} color={WARDEN_COLOR} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[ss.iconBtn, { backgroundColor: '#FEF2F2' }]}
            onPress={() => handleDelete(activeNotice)}
            disabled={deleting}
          >
            <Trash2 size={17} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <ScrollView style={ss.flex} contentContainerStyle={ss.detailContent} showsVerticalScrollIndicator={false}>
          {/* Badge + date */}
          <View style={ss.detailMeta}>
            <View style={ss.officialBadge}>
              <Megaphone size={12} color={WARDEN_COLOR} />
              <Text style={ss.officialBadgeTxt}>Official Notice</Text>
            </View>
            <View style={ss.detailDateRow}>
              <Calendar size={13} color={Colors.textMuted} />
              <Text style={ss.detailDate}>
                {new Date(activeNotice.createdAt).toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={ss.detailTitle}>{activeNotice.title}</Text>

          {/* Author */}
          <View style={ss.authorRow}>
            <View style={ss.authorAvatar}>
              <Text style={ss.authorAvatarTxt}>
                {activeNotice.createdBy?.name?.charAt(0) ?? 'W'}
              </Text>
            </View>
            <Text style={ss.authorName}>{activeNotice.createdBy?.name ?? 'Warden'}</Text>
            <View style={ss.authorRoleBadge}>
              <Text style={ss.authorRoleTxt}>
                {activeNotice.createdBy?.role ?? 'Warden'}
              </Text>
            </View>
          </View>

          {/* Image carousel */}
          {images.length > 0 && (
            <DetailCarousel images={images} onOpenLightbox={setLightboxIdx} />
          )}

          {/* Body */}
          <Text style={ss.detailBody}>{activeNotice.content}</Text>

          {/* Documents */}
          {docs.length > 0 && (
            <View style={ss.docsSection}>
              <Text style={ss.docsSectionLabel}>Attachments</Text>
              {docs.map((doc, i) => (
                <View key={i} style={ss.docCard}>
                  <View style={ss.docCardIcon}>
                    <FileText size={20} color={WARDEN_COLOR} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={ss.docCardLabel}>
                      Document{docs.length > 1 ? ` ${i + 1}` : ''}
                    </Text>
                    <Text style={ss.docCardAction}>Tap to View / Download</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Edit / Delete actions */}
        <View style={ss.detailActions}>
          <TouchableOpacity
            style={[ss.detailActionBtn, { backgroundColor: WARDEN_COLOR + '15', flex: 1 }]}
            onPress={() => openEdit(activeNotice)}
          >
            <Edit3 size={18} color={WARDEN_COLOR} />
            <Text style={[ss.detailActionTxt, { color: WARDEN_COLOR }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[ss.detailActionBtn, { backgroundColor: '#FEF2F2', flex: 1 }]}
            onPress={() => handleDelete(activeNotice)}
            disabled={deleting}
          >
            <Trash2 size={18} color="#EF4444" />
            <Text style={[ss.detailActionTxt, { color: '#EF4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>

        {/* Form modal */}
        {formOpen && (
          <NoticeFormModal
            notice={editingNotice}
            onClose={() => { setFormOpen(false); setEditingNotice(null); }}
            onSaved={n => { handleSaved(n); setActiveNotice(n); }}
          />
        )}
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  const renderItem = ({ item }: { item: Notice }) => {
    const atts   = normalizeAttachments(item);
    const images = atts.filter(a => a.type === 'image');
    const docs   = atts.filter(a => a.type !== 'image');

    return (
      <TouchableOpacity style={ss.card} onPress={() => openDetail(item)} activeOpacity={0.88}>
        {/* Slideshow thumbnail */}
        {images.length > 0 && <MiniSlideshow attachments={atts} />}

        <View style={ss.cardBody}>
          {/* Badge + date */}
          <View style={ss.cardTopRow}>
            <View style={ss.officialBadge}>
              <Megaphone size={11} color={WARDEN_COLOR} />
              <Text style={ss.officialBadgeTxt}>Official</Text>
            </View>
            <Text style={ss.cardDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {/* Title */}
          <Text style={ss.cardTitle}>{item.title}</Text>

          {/* Content preview */}
          <Text style={ss.cardContent} numberOfLines={3}>{item.content}</Text>

          {/* Document indicator */}
          {docs.length > 0 && (
            <View style={ss.docIndicator}>
              <FileText size={12} color={WARDEN_COLOR} />
              <Text style={ss.docIndicatorTxt}>{docs.length} document{docs.length > 1 ? 's' : ''} attached</Text>
            </View>
          )}

          {/* Footer */}
          <View style={ss.cardFooter}>
            <View style={ss.authorRowSmall}>
              <View style={ss.authorAvatarSm}>
                <Text style={ss.authorAvatarSmTxt}>
                  {item.createdBy?.name?.charAt(0) ?? 'W'}
                </Text>
              </View>
              <Text style={ss.authorNameSm}>Warden</Text>
            </View>
            <View style={ss.cardActions}>
              <TouchableOpacity
                style={ss.cardActionBtn}
                onPress={() => openEdit(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Edit3 size={15} color={WARDEN_COLOR} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[ss.cardActionBtn, { backgroundColor: '#FEF2F2' }]}
                onPress={() => handleDelete(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Trash2 size={15} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={ss.container}>
      {/* Summary bar */}
      <View style={ss.summaryBar}>
        <View style={ss.summaryBarIcon}>
          <Megaphone size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ss.summaryCount}>{notices.length}</Text>
          <Text style={ss.summaryLabel}>Active Notices</Text>
        </View>
        <TouchableOpacity style={ss.createBtn} onPress={openCreate} activeOpacity={0.85}>
          <Plus size={18} color="#fff" />
          <Text style={ss.createBtnTxt}>New Notice</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={ss.centered}>
          <ActivityIndicator size="large" color={WARDEN_COLOR} />
        </View>
      ) : (
        <FlatList
          data={notices}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={ss.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={ss.emptyWrap}>
              <Bell size={48} color={Colors.textMuted} />
              <Text style={ss.emptyTxt}>No notices broadcasted yet</Text>
              <TouchableOpacity style={ss.emptyCreateBtn} onPress={openCreate}>
                <Plus size={16} color="#fff" />
                <Text style={ss.emptyCreateTxt}>Create Notice</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Create / Edit Modal */}
      {formOpen && (
        <NoticeFormModal
          notice={editingNotice}
          onClose={() => { setFormOpen(false); setEditingNotice(null); }}
          onSaved={handleSaved}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ss = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: Colors.background },
  flex:      { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },

  // ── Summary bar ──
  summaryBar: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface,
    margin: 16, borderRadius: 24, padding: 20,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
  },
  summaryBarIcon: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: WARDEN_COLOR,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryCount: { fontSize: 26, fontWeight: '900', color: Colors.text },
  summaryLabel: { fontSize: 11, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: WARDEN_COLOR,
    paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 16, elevation: 4,
    shadowColor: WARDEN_COLOR, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6,
  },
  createBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 13 },

  // ── List ──
  list: { paddingHorizontal: 16, paddingBottom: 100 },

  // ── Card ──
  card: {
    backgroundColor: Colors.surface, borderRadius: 28,
    marginBottom: 16, overflow: 'hidden',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  cardBody:    { padding: 20 },
  cardTopRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle:   { fontSize: 18, fontWeight: '900', color: Colors.text, marginBottom: 8 },
  cardContent: { fontSize: 13, color: Colors.textMuted, lineHeight: 20, marginBottom: 12 },
  cardDate:    { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  cardFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.background, paddingTop: 14, marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 8 },
  cardActionBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: WARDEN_COLOR + '12',
    alignItems: 'center', justifyContent: 'center',
  },

  // Document indicator on card
  docIndicator:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  docIndicatorTxt: { fontSize: 11, fontWeight: '700', color: WARDEN_COLOR },

  // Author rows
  authorRowSmall:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  authorAvatarSm:    { width: 26, height: 26, borderRadius: 8, backgroundColor: WARDEN_COLOR + '20', alignItems: 'center', justifyContent: 'center' },
  authorAvatarSmTxt: { fontSize: 11, fontWeight: '900', color: WARDEN_COLOR },
  authorNameSm:      { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },

  // Official badge
  officialBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: WARDEN_COLOR + '12', borderRadius: 20 },
  officialBadgeTxt: { fontSize: 10, fontWeight: '900', color: WARDEN_COLOR, textTransform: 'uppercase', letterSpacing: 0.6 },

  // ── Mini slideshow ──
  slideWrap: { width: '100%', height: 180, position: 'relative', backgroundColor: '#000' },
  slideImg:  { width: '100%', height: '100%' },
  dotRow:    { position: 'absolute', bottom: 8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot:       { height: 5, borderRadius: 3 },
  dotActive: { width: 18, backgroundColor: '#fff' },
  dotInactive:{ width: 5, backgroundColor: 'rgba(255,255,255,0.45)' },

  // ── Empty ──
  emptyWrap:      { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 },
  emptyTxt:       { fontSize: 15, fontWeight: '700', color: Colors.textMuted },
  emptyCreateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: WARDEN_COLOR, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, marginTop: 4 },
  emptyCreateTxt: { color: '#fff', fontWeight: '800', fontSize: 13 },

  // ─────────────────────────────────────
  // DETAIL VIEW
  // ─────────────────────────────────────

  detailHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER_COLOR,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  iconBtn:           { width: 36, height: 36, borderRadius: 11, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  detailHeaderTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: Colors.text },
  detailContent:     { padding: 20, paddingBottom: 40 },

  detailMeta:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  detailDateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailDate:    { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  detailTitle:   { fontSize: 26, fontWeight: '900', color: Colors.text, lineHeight: 34, marginBottom: 14 },

  authorRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: BORDER_COLOR },
  authorAvatar:    { width: 32, height: 32, borderRadius: 10, backgroundColor: WARDEN_COLOR + '20', alignItems: 'center', justifyContent: 'center' },
  authorAvatarTxt: { fontSize: 13, fontWeight: '900', color: WARDEN_COLOR },
  authorName:      { fontSize: 14, fontWeight: '700', color: Colors.text },
  authorRoleBadge: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: Colors.background, borderRadius: 8 },
  authorRoleTxt:   { fontSize: 10, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase' },

  detailBody: { fontSize: 15, color: Colors.text, lineHeight: 24, fontWeight: '500', marginTop: 20, marginBottom: 24 },

  docsSection:      { marginTop: 8 },
  docsSectionLabel: { fontSize: 11, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  docCard:          { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.surface, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: BORDER_COLOR },
  docCardIcon:      { width: 42, height: 42, borderRadius: 12, backgroundColor: WARDEN_COLOR + '12', alignItems: 'center', justifyContent: 'center' },
  docCardLabel:     { fontSize: 10, fontWeight: '800', color: WARDEN_COLOR, textTransform: 'uppercase', letterSpacing: 0.6 },
  docCardAction:    { fontSize: 13, fontWeight: '700', color: Colors.text, marginTop: 2 },

  detailActions: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    paddingBottom: Platform.select({ ios: 28, android: 16 }),
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: BORDER_COLOR,
  },
  detailActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 16 },
  detailActionTxt: { fontSize: 15, fontWeight: '800' },

  // ── Detail carousel ──
  detailCarousel: { borderRadius: 20, overflow: 'hidden', backgroundColor: '#000', marginBottom: 8, position: 'relative' },
  detailImg:      { width: '100%', height: 260 },
  expandHint:     { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  expandHintTxt:  { fontSize: 9, fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.6 },
  carouselArrow:  { position: 'absolute', top: '40%', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  carouselCounter:{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  carouselCounterTxt: { fontSize: 11, fontWeight: '800', color: '#fff' },
  thumbStrip:     { position: 'absolute', bottom: 36, left: 0, right: 0 },
  thumb:          { width: 48, height: 32, borderRadius: 8, borderWidth: 2, borderColor: 'transparent', opacity: 0.65 },
  thumbActive:    { borderColor: '#fff', opacity: 1 },

  // ── Lightbox ──
  lightbox:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)', alignItems: 'center', justifyContent: 'center' },
  lightboxClose:   { position: 'absolute', top: Platform.select({ ios: 52, android: 20 }), right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  lightboxCounter: { position: 'absolute', top: Platform.select({ ios: 58, android: 26 }), alignSelf: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '700' },
  lightboxImg:     { width: SCREEN_W * 0.92, height: undefined, aspectRatio: 1, borderRadius: 16 },
  lightboxArrow:   { position: 'absolute', top: '45%', width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  lightboxDots:    { position: 'absolute', bottom: 40, flexDirection: 'row', gap: 8 },

  // ─────────────────────────────────────
  // FORM MODAL
  // ─────────────────────────────────────
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 24, paddingTop: 0, paddingBottom: Platform.select({ ios: 40, android: 24 }),
    maxHeight: '94%',
    height: '85%',
  },
  modalAccentBar: { height: 4, backgroundColor: WARDEN_COLOR, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginBottom: 0 },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, marginBottom: 24 },
  modalTitle:     { fontSize: 22, fontWeight: '900', color: Colors.text },
  modalCloseBtn:  { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },

  fieldLabel:    { fontSize: 11, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 },
  fieldInput: {
    backgroundColor: Colors.background, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, fontWeight: '600', color: Colors.text,
    borderWidth: 1, borderColor: BORDER_COLOR,
  },
  fieldTextArea: { height: 130, textAlignVertical: 'top' },

  // Attachment grid
  attachGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  attachThumbWrap:  { position: 'relative', width: 88, height: 88 },
  attachThumb:      { width: 88, height: 88, borderRadius: 14, backgroundColor: Colors.background },
  attachDocThumb:   { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER_COLOR },
  attachDocName:    { fontSize: 9, fontWeight: '700', color: Colors.textMuted, textAlign: 'center', marginTop: 4, paddingHorizontal: 4 },
  attachRemoveBtn:  { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', zIndex: 10 },

  addAttachBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 2, borderStyle: 'dashed', borderColor: WARDEN_COLOR + '40',
    borderRadius: 16, paddingVertical: 16, marginTop: 20,
    backgroundColor: WARDEN_COLOR + '06',
  },
  addAttachTxt: { fontSize: 13, fontWeight: '700', color: WARDEN_COLOR },

  submitBtn: {
    backgroundColor: WARDEN_COLOR,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, height: 58, borderRadius: 18, marginTop: 24, marginBottom: 8,
    elevation: 4, shadowColor: WARDEN_COLOR,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  submitTxt: { color: '#fff', fontSize: 16, fontWeight: '900' },
});