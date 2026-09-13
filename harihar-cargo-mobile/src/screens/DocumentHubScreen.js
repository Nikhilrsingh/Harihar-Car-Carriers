import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { AuthContext } from '../context/AuthContext';
import { cargoService } from '../services/cargoService';
import { generatePickupHtml } from '../templates/pickupTemplate';
import { generateLoadingHtml } from '../templates/loadingTemplate';
import { generateWebDocumentHtml } from '../utils/documentGenerator';

export default function DocumentHubScreen({ navigation }) {
  const { permissions } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('pickup');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPickupId, setExpandedPickupId] = useState(null);

  // View PDF Modal State
  const [pdfPreviewHtml, setPdfPreviewHtml] = useState('');
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Share Modal State
  const [shareModalItem, setShareModalItem] = useState(null);
  const [selectedShareIndices, setSelectedShareIndices] = useState([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const loadData = async (docType) => {
    setLoading(true);
    try {
      const data = await cargoService.fetchRecords(docType);
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert('Sync Error', `Could not fetch ${docType.toUpperCase()} records.`);
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  const handleViewPdf = async (item) => {
    try {
      let html = '';
      if (activeTab === 'pickup') {
        html = await generatePickupHtml(item);
      } else if (activeTab === 'loading') {
        html = await generateLoadingHtml(item);
      } else {
        html = await generateWebDocumentHtml(activeTab, item);
      }
      setPdfPreviewHtml(html);
      setShowPdfModal(true);
    } catch (err) {
      Alert.alert('Error', 'Could not render PDF preview.');
    }
  };

  const handleDelete = (itemIndex) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updatedList = records.filter((_, idx) => idx !== itemIndex);
          setLoading(true);
          try {
            await cargoService.saveRecord(activeTab, updatedList);
            setRecords(updatedList);
            Alert.alert('Deleted', 'Record removed.');
          } catch (err) {
            Alert.alert('Error', 'Failed to delete record.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleOpenShareModal = (item) => {
    const carList = Array.isArray(item.cars) && item.cars.length > 0
      ? item.cars
      : Array.isArray(item.vehicles) && item.vehicles.length > 0
      ? item.vehicles
      : [item];
      
    setShareModalItem(item);
    setSelectedShareIndices(carList.map((_, idx) => idx));
  };

  const toggleShareVehicleSelection = (idx) => {
    if (selectedShareIndices.includes(idx)) {
      if (selectedShareIndices.length === 1) {
        Alert.alert('Selection Error', 'Please select at least one vehicle.');
        return;
      }
      setSelectedShareIndices(selectedShareIndices.filter((i) => i !== idx));
    } else {
      setSelectedShareIndices([...selectedShareIndices, idx]);
    }
  };

  const executeShare = async (itemToShare) => {
    setIsGeneratingPdf(true);
    try {
      const rawCars = Array.isArray(itemToShare.cars) && itemToShare.cars.length > 0
        ? itemToShare.cars
        : Array.isArray(itemToShare.vehicles) && itemToShare.vehicles.length > 0
        ? itemToShare.vehicles
        : [itemToShare];

      const filteredCars = rawCars.filter((_, idx) => selectedShareIndices.includes(idx));
      const payload = {
        ...itemToShare,
        cars: filteredCars.length > 0 ? filteredCars : rawCars,
      };

      let html = activeTab === 'loading' ? await generateLoadingHtml(payload) : await generateWebDocumentHtml(activeTab, payload);
      const { uri } = await Print.printToFileAsync({ html });
      const targetUri = `${FileSystem.cacheDirectory}${activeTab.toUpperCase()}_Document.pdf`;

      await FileSystem.copyAsync({ from: uri, to: targetUri });
      await Sharing.shareAsync(targetUri, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf' });

      setShareModalItem(null);
    } catch (err) {
      Alert.alert('Share Failed', err.message || 'Could not share PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const filteredRecords = records.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const id = (item.pickupNo || item.pickupId || item.lrNo || item.invoiceNo || item.loadingNo || '').toLowerCase();
    const driver = (item.whoPicked || item.partyName || item.consignorName || item.driverName || '').toLowerCase();
    const car = (item.carName || item.carNo || item.carNumber || '').toLowerCase();
    const packer = (item.packerName || '').toLowerCase();
    return id.includes(q) || driver.includes(q) || car.includes(q) || packer.includes(q);
  });

  const renderItem = ({ item, index }) => {
    const docId = item.pickupNo || item.pickupId || item.lrNo || item.loadingNo || item.invoiceNo || `HCC-${activeTab.toUpperCase()}-0${index + 1}`;
    const docDate = item.pickupDate || item.loadingDate || item.date || '-';
    const driver = item.whoPicked || item.driverName || item.partyName || '-';

    const vehicleList = Array.isArray(item.vehicles) && item.vehicles.length > 0
      ? item.vehicles
      : Array.isArray(item.cars) && item.cars.length > 0
      ? item.cars
      : [item];

    const isExpanded = expandedPickupId === docId;

    return (
      <View style={styles.recordCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.pickupIdText}>{docId}</Text>
          <Text style={styles.dateText}>{docDate}</Text>
        </View>

        <Text style={styles.whoPickedText}>Party/Driver: <Text style={styles.boldText}>{driver}</Text></Text>

        <TouchableOpacity
          style={styles.expandToggleBtn}
          onPress={() => setExpandedPickupId(isExpanded ? null : docId)}
        >
          <Text style={styles.expandToggleText}>
            🚗 {vehicleList.length} Vehicle(s) {isExpanded ? '▲ Hide' : '▼ View'}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.subTableContainer}>
            <Text style={styles.subTableTitle}>ENTRIES IN BATCH:</Text>
            {vehicleList.map((v, vIdx) => (
              <View key={vIdx} style={styles.subTableRow}>
                <Text style={styles.subTableIndex}>#{vIdx + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subTableCar}>{v.carName || '-'} ({v.carNo || v.carNumber || '-'})</Text>
                  <Text style={styles.subTableSub}>Party: {v.partyName || v.consignorName || '-'} | {v.partyNo || v.partyNumber || '-'}</Text>
                  <Text style={styles.subTableSub}>Route: {v.fromLocation || 'NAGPUR'} ➔ {v.toLocation || '-'}{v.carValue ? ` | Value: ₹${v.carValue}` : ''}</Text>
                  <Text style={styles.subTablePacker}>Packer Name: {v.packerName || '-'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtnView} onPress={() => handleViewPdf(item)}>
            <Text style={styles.actionText}>👁️ VIEW PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtnShare} onPress={() => handleOpenShareModal(item)}>
            <Text style={styles.actionText}>🟢 SHARE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnEdit}
            onPress={() => {
              const targetScreen = activeTab === 'pickup' ? 'PickupForm' : activeTab === 'loading' ? 'LoadingForm' : 'BiltyForm';
              navigation.navigate(targetScreen, { editItem: item, existingRecords: records });
            }}
          >
            <Text style={styles.actionText}>✏️ EDIT</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtnDelete} onPress={() => handleDelete(index)}>
            <Text style={styles.actionText}>🗑️ DELETE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {['pickup', 'bilty', 'loading', 'invoice'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchBarWrapper}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search Doc ID, Driver, Car, Party, Packer..."
          placeholderTextColor="#64748b"
        />
      </View>

      <View style={styles.actionHeader}>
        <Text style={styles.sectionTitle}>{activeTab.toUpperCase()} MANIFESTS ({filteredRecords.length})</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => {
            const targetScreen = activeTab === 'pickup' ? 'PickupForm' : activeTab === 'loading' ? 'LoadingForm' : 'BiltyForm';
            navigation.navigate(targetScreen, { existingRecords: records });
          }}
        >
          <Text style={styles.createBtnText}>+ NEW {activeTab.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#dc2626" />
        </View>
      ) : (
        <FlatList
          data={filteredRecords}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(activeTab)} tintColor="#dc2626" />}
        />
      )}

      {/* PDF View Modal */}
      <Modal visible={showPdfModal} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#0f172a', paddingTop: 40 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#334155' }}>
            <Text style={{ color: '#dc2626', fontWeight: '800', fontSize: 14 }}>{activeTab.toUpperCase()} PDF PREVIEW</Text>
            <TouchableOpacity onPress={() => setShowPdfModal(false)}>
              <Text style={{ color: '#ffffff', fontWeight: '800' }}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <WebView source={{ html: pdfPreviewHtml }} style={{ flex: 1 }} />
        </View>
      </Modal>

      {/* Share Selection Modal */}
      {shareModalItem && (
        <Modal visible={true} animationType="fade" transparent={true}>
          <View style={styles.modalBg}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Share {activeTab.toUpperCase()} PDF 🎉</Text>
              <Text style={styles.modalSub}>Select vehicles to include:</Text>

              <ScrollView style={{ maxHeight: 180, marginVertical: 8 }}>
                {(Array.isArray(shareModalItem.cars) && shareModalItem.cars.length > 0
                  ? shareModalItem.cars
                  : Array.isArray(shareModalItem.vehicles) && shareModalItem.vehicles.length > 0
                  ? shareModalItem.vehicles
                  : [shareModalItem]
                ).map((c, i) => {
                  const isChecked = selectedShareIndices.includes(i);
                  return (
                    <TouchableOpacity
                      key={i}
                      style={styles.carSelectItem}
                      onPress={() => toggleShareVehicleSelection(i)}
                    >
                      <Text style={styles.checkboxText}>{isChecked ? '☑️' : '⏹️'}</Text>
                      <Text style={styles.carSelectText}>
                        #{i + 1} {c.carName || 'Vehicle'} ({c.carNumber || c.carNo || 'N/A'})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => setShareModalItem(null)}
                  disabled={isGeneratingPdf}
                >
                  <Text style={styles.btnText}>CANCEL</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareModalBtn}
                  onPress={() => executeShare(shareModalItem)}
                  disabled={isGeneratingPdf}
                >
                  {isGeneratingPdf ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.btnText}>📲 SHARE SELECTED</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', paddingTop: 10 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8 },
  tabBtn: { flex: 1, paddingVertical: 10, backgroundColor: '#1e293b', borderRadius: 8, alignItems: 'center', marginHorizontal: 2 },
  tabBtnActive: { backgroundColor: '#dc2626' },
  tabText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  tabTextActive: { color: '#ffffff', fontWeight: '800' },
  searchBarWrapper: { paddingHorizontal: 16, marginBottom: 8 },
  searchInput: { backgroundColor: '#1e293b', color: '#ffffff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, borderWidth: 1, borderColor: '#334155' },
  actionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 },
  sectionTitle: { color: '#dc2626', fontSize: 12, fontWeight: '800' },
  createBtn: { backgroundColor: '#dc2626', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  createBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  recordCard: { backgroundColor: '#1e293b', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  pickupIdText: { color: '#38bdf8', fontWeight: '800', fontSize: 14 },
  dateText: { color: '#94a3b8', fontSize: 11 },
  whoPickedText: { color: '#cbd5e1', fontSize: 12, marginBottom: 6 },
  boldText: { color: '#ffffff', fontWeight: '700' },
  expandToggleBtn: { backgroundColor: '#0284c720', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 8 },
  expandToggleText: { color: '#38bdf8', fontWeight: '800', fontSize: 11 },
  subTableContainer: { backgroundColor: '#0f172a', borderRadius: 8, padding: 8, marginVertical: 6 },
  subTableTitle: { color: '#94a3b8', fontSize: 10, fontWeight: '800', marginBottom: 6 },
  subTableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingVertical: 6 },
  subTableIndex: { color: '#38bdf8', fontWeight: '800', width: 24 },
  subTableCar: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  subTableSub: { color: '#94a3b8', fontSize: 10, marginTop: 1 },
  subTablePacker: { color: '#f59e0b', fontSize: 10, fontWeight: '700', marginTop: 2 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 8 },
  actionBtnView: { backgroundColor: '#0284c7', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6 },
  actionBtnShare: { backgroundColor: '#16a34a', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6 },
  actionBtnEdit: { backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#38bdf8' },
  actionBtnDelete: { backgroundColor: '#dc2626', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6 },
  actionText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#dc2626', textAlign: 'center' },
  modalSub: { color: '#94a3b8', fontSize: 11, textAlign: 'center', marginVertical: 8 },
  carSelectItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  checkboxText: { fontSize: 16, marginRight: 10 },
  carSelectText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  cancelModalBtn: { flex: 0.45, backgroundColor: '#334155', paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  shareModalBtn: { flex: 0.52, backgroundColor: '#16a34a', paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  btnText: { color: '#ffffff', fontWeight: '800', fontSize: 12 },
});