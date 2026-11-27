/**
 * LocalBusiness and all its subtypes in schema.org (direct and indirect, without superseded
 * types), generated from https://schema.org/version/latest/schemaorg-current-https.jsonld.
 * Includes medical specialties such as `Physiotherapy`, which schema.org also defines as
 * subclasses of MedicalBusiness.
 */
export const LOCAL_BUSINESS_TYPES = [
  'AccountingService', 'AdultEntertainment', 'AmusementPark', 'AnimalShelter',
  'ArchiveOrganization', 'ArtGallery', 'Attorney', 'Audiology', 'AutoBodyShop', 'AutoDealer',
  'AutoPartsStore', 'AutoRental', 'AutoRepair', 'AutoWash', 'AutomatedTeller',
  'AutomotiveBusiness', 'Bakery', 'BankOrCreditUnion', 'BarOrPub', 'BeautySalon',
  'BedAndBreakfast', 'BikeStore', 'BookStore', 'BowlingAlley', 'Brewery', 'CafeOrCoffeeShop',
  'Campground', 'Casino', 'ChildCare', 'ClothingStore', 'ComedyClub', 'CommunityHealth',
  'ComputerStore', 'ConvenienceStore', 'CovidTestingFacility', 'DaySpa', 'Dentist',
  'DepartmentStore', 'Dermatology', 'DietNutrition', 'Distillery', 'DryCleaningOrLaundry',
  'Electrician', 'ElectronicsStore', 'Emergency', 'EmergencyService', 'EmploymentAgency',
  'EntertainmentBusiness', 'ExerciseGym', 'FastFoodRestaurant', 'FinancialService', 'FireStation',
  'Florist', 'FoodEstablishment', 'FurnitureStore', 'GardenStore', 'GasStation',
  'GeneralContractor', 'Geriatric', 'GolfCourse', 'GovernmentOffice', 'GroceryStore',
  'Gynecologic', 'HVACBusiness', 'HairSalon', 'HardwareStore', 'HealthAndBeautyBusiness',
  'HealthClub', 'HobbyShop', 'HomeAndConstructionBusiness', 'HomeGoodsStore', 'Hospital', 'Hostel',
  'Hotel', 'HousePainter', 'IceCreamShop', 'IndividualPhysician', 'InsuranceAgency',
  'InternetCafe', 'JewelryStore', 'LegalService', 'Library', 'LiquorStore', 'LocalBusiness',
  'Locksmith', 'LodgingBusiness', 'MedicalBusiness', 'MedicalClinic', 'MensClothingStore',
  'Midwifery', 'MobilePhoneStore', 'Motel', 'MotorcycleDealer', 'MotorcycleRepair',
  'MovieRentalStore', 'MovieTheater', 'MovingCompany', 'MusicStore', 'NailSalon', 'NightClub',
  'Notary', 'Nursing', 'Obstetric', 'OfficeEquipmentStore', 'Oncologic', 'Ophthalmology',
  'Optician', 'Optometric', 'Otolaryngologic', 'OutletStore', 'PawnShop', 'Pediatric', 'PetStore',
  'Pharmacy', 'Physician', 'PhysiciansOffice', 'Physiotherapy', 'PlasticSurgery', 'Plumber',
  'Podiatric', 'PoliceStation', 'PostOffice', 'PrimaryCare', 'ProfessionalService', 'Psychiatric',
  'PublicHealth', 'PublicSwimmingPool', 'RadioStation', 'RealEstateAgent', 'RecyclingCenter',
  'Resort', 'Restaurant', 'RoofingContractor', 'SelfStorage', 'ShoeStore', 'ShoppingCenter',
  'SkiResort', 'SportingGoodsStore', 'SportsActivityLocation', 'SportsClub', 'StadiumOrArena',
  'Store', 'TattooParlor', 'TelevisionStation', 'TennisComplex', 'TireShop',
  'TouristInformationCenter', 'ToyStore', 'TravelAgency', 'VacationRental', 'WholesaleStore',
  'Winery',
] as const;

export type LocalBusinessType = (typeof LOCAL_BUSINESS_TYPES)[number];

const subtypes = new Set<string>(LOCAL_BUSINESS_TYPES);

/** The types plus `LocalBusiness` when one of them is a subtype, so subtypes are handled like it. */
export function withLocalBusiness(types: string[]): string[] {
  return !types.includes('LocalBusiness') && types.some((t) => subtypes.has(t)) ? [...types, 'LocalBusiness'] : types;
}
