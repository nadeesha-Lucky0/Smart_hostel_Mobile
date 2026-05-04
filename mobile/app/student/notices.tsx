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
  ScrollView,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import Colors from '../../constants/Colors';
import {
  Bell,
  Megaphone,
  Calendar,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Clock,
  ArrowLeft
} from 'lucide-react-native';
import api from '../../services/api';

// --- Types ---
interface Attachment {
  url: string;
  type: 'image' | 'document' | string;
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

const { width: SCREEN_W } = Dimensions.get('window');
const STUDENT_COLOR = Colors.roles.student;

// --- Helpers ---
const normalizeAttachments = (notice: Partial<Notice>): Attachment[] => {
  if (notice.attachments && notice.attachments.length > 0) return notice.attachments;
  if (notice.attachmentUrl)
    return [{ url: notice.attachmentUrl, type: notice.attachmentType ?? 'image' }];
  return [];
};

// --- Mini Slideshow ---
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

// --- Image Carousel Modal ---
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
        <TouchableOpacity style={ss.lightboxClose} onPress={onClose}>
          <X size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={ss.lightboxCounter}>{idx + 1} / {images.length}</Text>
        <Image
          source={{ uri: images[idx].url }}
          style={ss.lightboxImg}
          resizeMode="contain"
        />
        {images.length > 1 && (
          <>
            <TouchableOpacity style={[ss.lightboxArrow, { left: 16 }]} onPress={prev}>
              <ChevronLeft size={32} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[ss.lightboxArrow, { right: 16 }]} onPress={next}>
              <ChevronRight size={32} color="#fff" />
            </TouchableOpacity>
            <View style={ss.lightboxDots}>
              {images.map((_, i) => (
                <View key={i} style={[ss.dot, i === idx ? ss.dotActive : ss.dotInactive]} />
              ))}
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

// --- Main Student Notices Component ---
export default function StudentNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const fetchNotices = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await api.get('/notices');
      const list = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setNotices(list);
    } catch (err) {
      console.error('Fetch notices error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotices(false);
  };

  const renderNoticeItem = ({ item }: { item: Notice }) => {
    const atts = normalizeAttachments(item);
    const images = atts.filter(a => a.type === 'image');
    const docs = atts.filter(a => a.type !== 'image');

    return (
      <TouchableOpacity 
        style={ss.card} 
        onPress={() => setSelectedNotice(item)}
        activeOpacity={0.9}
      >
        {images.length > 0 && <MiniSlideshow attachments={atts} />}
        <View style={ss.cardBody}>
          <View style={ss.cardTopRow}>
            <View style={ss.officialBadge}>
              <Megaphone size={12} color={STUDENT_COLOR} />
              <Text style={ss.officialBadgeTxt}>Official</Text>
            </View>
            <Text style={ss.cardDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
          <Text style={ss.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={ss.cardContent} numberOfLines={3}>{item.content}</Text>
          
          <View style={ss.cardFooter}>
             <View style={ss.authorRow}>
                <View style={ss.authorAvatar}>
                  <Text style={ss.authorAvatarTxt}>{item.createdBy?.name?.charAt(0) || 'W'}</Text>
                </View>
                <Text style={ss.authorName}>{item.createdBy?.name || 'Warden'}</Text>
             </View>
             {docs.length > 0 && (
               <View style={ss.docIndicator}>
                 <FileText size={14} color={Colors.textMuted} />
                 <Text style={ss.docIndicatorTxt}>{docs.length} File{docs.length > 1 ? 's' : ''}</Text>
               </View>
             )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (selectedNotice) {
    const atts = normalizeAttachments(selectedNotice);
    const images = atts.filter(a => a.type === 'image');
    const docs = atts.filter(a => a.type !== 'image');

    return (
      <SafeAreaView style={ss.detailSafeArea}>
        {lightboxIdx !== null && (
          <ImageCarousel 
            images={images} 
            initialIndex={lightboxIdx} 
            onClose={() => setLightboxIdx(null)} 
          />
        )}
        <View style={ss.detailHeader}>
           <TouchableOpacity onPress={() => setSelectedNotice(null)} style={ss.backBtn}>
              <ArrowLeft size={24} color={Colors.text} />
           </TouchableOpacity>
           <Text style={ss.detailHeaderTitle} numberOfLines={1}>Notice Detail</Text>
           <View style={{ width: 40 }} />
        </View>

        <ScrollView style={ss.flex} contentContainerStyle={ss.detailScroll} showsVerticalScrollIndicator={false}>
          <View style={ss.detailMeta}>
             <View style={ss.officialBadge}>
                <Megaphone size={14} color={STUDENT_COLOR} />
                <Text style={ss.officialBadgeTxt}>Official Announcement</Text>
             </View>
             <View style={ss.dateRow}>
                <Clock size={14} color={Colors.textMuted} />
                <Text style={ss.dateText}>
                  {new Date(selectedNotice.createdAt).toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </Text>
             </View>
          </View>

          <Text style={ss.detailTitle}>{selectedNotice.title}</Text>
          
          <View style={ss.detailAuthor}>
             <View style={ss.authorAvatarLarge}>
                <Text style={ss.authorAvatarLargeTxt}>{selectedNotice.createdBy?.name?.charAt(0) || 'W'}</Text>
             </View>
             <View>
                <Text style={ss.detailAuthorName}>{selectedNotice.createdBy?.name || 'Warden'}</Text>
                <Text style={ss.detailAuthorRole}>{selectedNotice.createdBy?.role || 'Hostel Warden'}</Text>
             </View>
          </View>

          {images.length > 0 && (
            <View style={ss.detailImageWrap}>
              <TouchableOpacity activeOpacity={0.9} onPress={() => setLightboxIdx(0)}>
                <Image source={{ uri: images[0].url }} style={ss.detailMainImg} />
                <View style={ss.expandOverlay}>
                   <ZoomIn size={20} color="#fff" />
                   <Text style={ss.expandText}>Tap to View All Photos</Text>
                </View>
              </TouchableOpacity>
              {images.length > 1 && (
                <Text style={ss.morePhotosTxt}>+ {images.length - 1} more photo{images.length > 2 ? 's' : ''}</Text>
              )}
            </View>
          )}

          <Text style={ss.detailBody}>{selectedNotice.content}</Text>

          {docs.length > 0 && (
            <View style={ss.detailDocs}>
               <Text style={ss.docsTitle}>Attachments</Text>
               {docs.map((doc, i) => (
                 <View key={i} style={ss.docItem}>
                    <FileText size={24} color={STUDENT_COLOR} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                       <Text style={ss.docName} numberOfLines={1}>Document {i+1}</Text>
                       <Text style={ss.docAction}>Tap to download</Text>
                    </View>
                 </View>
               ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <View style={ss.container}>
      <View style={ss.header}>
        <View>
          <Text style={ss.title}>Notices</Text>
          <Text style={ss.subtitle}>Stay updated with hostel news</Text>
        </View>
        <View style={ss.bellIcon}>
           <Bell size={24} color={STUDENT_COLOR} />
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={ss.centered}>
          <ActivityIndicator size="large" color={STUDENT_COLOR} />
        </View>
      ) : (
        <FlatList
          data={notices}
          renderItem={renderNoticeItem}
          keyExtractor={item => item._id}
          contentContainerStyle={ss.list}
          onRefresh={onRefresh}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={ss.empty}>
              <Megaphone size={48} color={Colors.border} />
              <Text style={ss.emptyTxt}>No notices found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const ss = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  bellIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: STUDENT_COLOR + '10', alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: Colors.surface, borderRadius: 24, marginBottom: 20, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  slideWrap: { height: 180, width: '100%', position: 'relative' },
  slideImg: { width: '100%', height: '100%' },
  dotRow: { position: 'absolute', bottom: 12, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { backgroundColor: '#fff', width: 12 },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.5)' },
  cardBody: { padding: 16 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  officialBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: STUDENT_COLOR + '10', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 6 },
  officialBadgeTxt: { fontSize: 10, fontWeight: '800', color: STUDENT_COLOR, textTransform: 'uppercase' },
  cardDate: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  cardTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  cardContent: { fontSize: 14, color: Colors.textMuted, lineHeight: 20, marginBottom: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  authorAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: STUDENT_COLOR + '15', alignItems: 'center', justifyContent: 'center' },
  authorAvatarTxt: { fontSize: 12, fontWeight: '800', color: STUDENT_COLOR },
  authorName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  docIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  docIndicatorTxt: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 16 },
  emptyTxt: { fontSize: 16, color: Colors.textMuted, fontWeight: '600' },

  // Detail Styles
  detailSafeArea: { flex: 1, backgroundColor: Colors.background },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  detailHeaderTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  detailScroll: { padding: 20 },
  detailMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  detailTitle: { fontSize: 24, fontWeight: '900', color: Colors.text, marginBottom: 20 },
  detailAuthor: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  authorAvatarLarge: { width: 48, height: 48, borderRadius: 24, backgroundColor: STUDENT_COLOR + '15', alignItems: 'center', justifyContent: 'center' },
  authorAvatarLargeTxt: { fontSize: 20, fontWeight: '900', color: STUDENT_COLOR },
  detailAuthorName: { fontSize: 16, fontWeight: '800', color: Colors.text },
  detailAuthorRole: { fontSize: 12, color: STUDENT_COLOR, fontWeight: '700', textTransform: 'uppercase' },
  detailImageWrap: { marginBottom: 24, borderRadius: 24, overflow: 'hidden' },
  detailMainImg: { width: '100%', height: 250 },
  expandOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', gap: 8 },
  expandText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  morePhotosTxt: { textAlign: 'center', marginTop: 8, fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  detailBody: { fontSize: 16, color: Colors.text, lineHeight: 26, marginBottom: 32 },
  detailDocs: { backgroundColor: Colors.surface, borderRadius: 24, padding: 20, marginBottom: 40 },
  docsTitle: { fontSize: 14, fontWeight: '900', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 16 },
  docItem: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: Colors.background, borderRadius: 16, marginBottom: 12 },
  docName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  docAction: { fontSize: 12, color: STUDENT_COLOR, fontWeight: '700' },

  // Lightbox
  lightbox: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  lightboxClose: { position: 'absolute', top: 60, right: 24, zIndex: 10 },
  lightboxCounter: { position: 'absolute', top: 64, width: '100%', textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: '700' },
  lightboxImg: { width: SCREEN_W, height: SCREEN_W * 1.5 },
  lightboxArrow: { position: 'absolute', width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  lightboxDots: { position: 'absolute', bottom: 60, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  flex: { flex: 1 }
});
