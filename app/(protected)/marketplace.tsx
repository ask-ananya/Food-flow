import {
    View,
    FlatList,
    Text,
    StyleSheet,
    Dimensions,
    Platform,
    TouchableOpacity,
    SafeAreaView,
    ScrollView, TextInput
} from "react-native";
import React, {useState} from "react";
import {Link, useRouter} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {Picker} from "@react-native-picker/picker";

// define a type recipient
type Recipient = {
    id: number;
    name: string;
};

type Donor = {
    id: number;
    name: string;
}

export default function Marketplace() {
    let router = useRouter();

    let [data, setData] = useState([
        {
            recipient: {
                id: 1,
                name: "Hope Community Kitchen",
            },
            donor: {
                id: 1,
                name: "Fresh Market Downtown",
            },
        },
        {
            recipient: {
                id: 2,
                name: "St. Mary's Food Bank",
            },
            donor: {
                id: 2,
                name: "Sunshine Bakery",
            },
        },
        {
            recipient: {
                id: 3,
                name: "Community Outreach Center",
            },
            donor: {
                id: 3,
                name: "Green Grove Market",
            },
        },
        {
            recipient: {
                id: 4,
                name: "Local Shelter Alliance",
            },
            donor: {
                id: 4,
                name: "Harbor Restaurant",
            },
        },
        {
            recipient: {
                id: 5,
                name: "City Fresh Foods",
            },
            donor: {
                id: 5,
                name: "City Fresh Foods",
            },
        },
    ]);

    const renderMatchCard = (recipientInfo: Recipient, donorInfo: Donor, index: any) => {
        // @ts-ignore
        // @ts-ignore
        // @ts-ignore
        return (
            <View key={`match-${index}`} style={styles.urgentCard}>
                <View style={styles.combinedCardContent}>
                    {/* Recipient Section */}
                    <View style={styles.cardHalf}>
                        <Text style={styles.cardSectionTitle}>RECIPIENT</Text>
                        <Text style={styles.cardOrganizationName}>
                            {recipientInfo.name}
                        </Text>
                    </View>

                    {/* Divider */}
                    <View style={styles.cardDivider} />

                    {/* Donor Section */}
                    <View style={styles.cardHalf}>
                        <Text style={styles.cardSectionTitle}>DONOR</Text>
                        <Text style={styles.cardOrganizationName}>{donorInfo.name}</Text>
                    </View>
                </View>
                <Link
                    href={{
                        pathname: "/details",
                        params: {
                            recipientName: recipientInfo.name,
                            recipientId: recipientInfo.id,
                            donorName: donorInfo.name,
                            donorId: donorInfo.id,
                        },
                    }}
                    asChild
                >
                    <TouchableOpacity className="bg-[#3949AB] py-2 px-6 rounded-lg mt-4 self-center shadow shadow-black/10">
                        <Text className="text-white font-semibold text-sm">Details</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView className="flex-1 bg-gray-50">
                <View className="flex-row items-center justify-between p-5 bg-white border-b border-gray-200 shadow">
                    <TouchableOpacity
                        className="p-2 rounded-full bg-white/80"
                        onPress={() => router.push("/home")}
                    >
                        <Ionicons name="arrow-back" size={24} color="#303F9F" />
                    </TouchableOpacity>
                    <Text className="flex-1 text-2xl font-bold text-[#303F9F] text-center -ml-6">
                        Marketplace
                    </Text>
                    <View className="w-6" />
                </View>
                {/* iterate through data and use render match card */}
                <View className={"p-2"}>
                    {data.map((match, index) => {
                        return renderMatchCard(match.recipient, match.donor, index);
                    })}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: "white",
    },
    container: {
        flex: 1,
    },
    background: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height,
    },
    contentContainer: {
        flex: 1,
        padding: 16,
    },
    header: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: "white", // Changed from rgba with transparency
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#303F9F",
    },
    headerIcons: {
        flexDirection: "row",
        alignItems: "center",
    },
    icon: {
        marginLeft: 15,
    },
    searchInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginVertical: 16,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: "#2d3748",
        height: 40,
        paddingVertical: 0,
    },
    scrollContent: {
        paddingBottom: 80,
    },
    metricsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 30,
        gap: 12,
        marginTop: 20,
    },
    metricCard: {
        borderRadius: 16,
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.15,
        shadowRadius: 12,
        overflow: "hidden",
    },
    metricGradient: {
        width: "100%",
        height: "100%",
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        padding: 12,
    },
    smallMetricCard: {
        width: 90,
        height: 90,
    },
    primaryMetricCard: {
        width: 120,
        height: 120,
        elevation: 8,
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    metricNumber: {
        fontSize: 24,
        fontWeight: "700",
        color: "#303F9F",
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 12,
        color: "#303F9F",
        textAlign: "center",
        fontWeight: "500",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#303F9F",
        marginBottom: 16,
        marginLeft: 4,
    },
    recommendationsSection: {
        marginTop: 16,
    },
    loadingContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: "#666",
    },
    noMatchesText: {
        textAlign: "center",
        fontSize: 16,
        color: "#666",
        marginVertical: 24,
    },
    urgentCard: {
        backgroundColor: "white",
        borderRadius: 16,
        marginBottom: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.8)",
    },
    combinedCardContent: {
        flexDirection: "row",
        borderRadius: 15,
        overflow: "hidden",
    },
    cardHalf: {
        flex: 1,
        padding: 16,
    },
    cardDivider: {
        width: 1,
        backgroundColor: "#e2e8f0",
        marginVertical: 16,
    },
    cardSectionTitle: {
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 1,
        color: "#666",
        marginBottom: 8,
    },
    cardOrganizationName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#2d3748",
        lineHeight: 24,
    },
    detailsButton: {
        backgroundColor: "#3949AB",
        paddingVertical: 8,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginTop: 16,
        alignSelf: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    detailsButtonText: {
        color: "white",
        fontWeight: "600",
        fontSize: 14,
    },
    viewMoreButton: {
        backgroundColor: "#4A4A8A",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: "center",
        marginVertical: 8,
    },
    viewMoreButtonText: {
        color: "white",
        fontWeight: "600",
        fontSize: 14,
    },
    bottomNav: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        backgroundColor: "white",
        padding: 12,
        paddingBottom: Platform.OS === "ios" ? 34 : 12,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: -4},
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 8,
        // Add these properties to extend to bottom
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    navItem: {
        alignItems: "center",
        paddingHorizontal: 16,
    },
    navLabel: {
        fontSize: 12,
        color: "#666",
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalView: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 10,
        width: "90%",
        maxWidth: 480,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#303F9F",
        marginBottom: 8,
        textAlign: "center",
    },
    modalSubtitle: {
        fontSize: 16,
        color: "#4A5568",
        marginBottom: 24,
        textAlign: "center",
        lineHeight: 22,
    },
    modalInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F7FAFC",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        paddingHorizontal: 16,
        marginBottom: 24,
        width: "100%",
    },
    capacityInput: {
        flex: 1,
        fontSize: 18,
        padding: 12,
        color: "#2D3748",
    },
    unitText: {
        fontSize: 16,
        color: "#4A5568",
        fontWeight: "500",
    },
    foodTypesContainer: {
        width: "100%",
        marginBottom: 16,
    },
    checkboxContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        width: "100%",
        paddingHorizontal: 4,
    },
    checkbox: {
        marginRight: 12,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: "#3949AB",
    },
    checkboxLabel: {
        fontSize: 16,
        color: "#4A5568",
        flex: 1,
    },
    submitButton: {
        backgroundColor: "#3949AB",
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: "100%",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    submitButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },
});