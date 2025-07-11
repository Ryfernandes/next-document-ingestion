// src/components/FeedbackComponents/ConversionStep.tsx

'use client';

import './TableStyling.css';
import './ModalStyling.css';

import JSZip, { filter } from 'jszip';

import {
  Flex,
  FlexItem,
  Card,
  CardTitle,
  CardBody,
  Badge,
  Toolbar,
  ToolbarItem,
  ToolbarContent,
  SearchInput,
  MenuToggleCheckbox,
  MenuToggle,
  Button,
  Icon,
  Content,
  MenuToggleElement,
  Dropdown,
  DropdownItem,
  DropdownList,
  Divider,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Menu,
  MenuContent,
  MenuList,
  MenuItem,
  TextInput,
  Checkbox,
  TextArea,
  DrilldownMenu,
  MenuContainer,
  Tooltip,
  Tabs,
  Tab,
  TabTitleText,
  Pagination,
  ExpandableSection,
  MenuToggleAction
} from '@patternfly/react-core';

import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td
} from '@patternfly/react-table'

import { useState, useEffect, useRef } from 'react';

import ConversionHeader from './ConversionHeader';
import FileUpload from './FileUpload';

import { conversionProfile, conversionProfileDisplay, equivalentConversionProfiles, creationDefault, defaultConversionProfiles, getConversionProfileDisplay } from '@/utils/conversionProfiles';
import { convertFilesToMarkdownWithOptions } from './ConversionUtils';

import { useTimer } from './Timer';

import WarningIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import CheckCircleIcon from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import FileAlt from '@patternfly/react-icons/dist/esm/icons/outlined-file-alt-icon';
import FileCode from '@patternfly/react-icons/dist/esm/icons/outlined-file-code-icon';
import FileExcel from '@patternfly/react-icons/dist/esm/icons/outlined-file-excel-icon';
import FileIcon from '@patternfly/react-icons/dist/esm/icons/outlined-file-icon';
import FileImage from '@patternfly/react-icons/dist/esm/icons/outlined-file-image-icon';
import FilePDF from '@patternfly/react-icons/dist/esm/icons/outlined-file-pdf-icon';
import FilePowerpoint from '@patternfly/react-icons/dist/esm/icons/outlined-file-powerpoint-icon';
import FileWord from '@patternfly/react-icons/dist/esm/icons/outlined-file-word-icon';
import EllipsisVIcon from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
import PlusIcon from '@patternfly/react-icons/dist/esm/icons/plus-icon';
import PendingIcon from '@patternfly/react-icons/dist/esm/icons/pending-icon';
import ExternalLinkIcon from '@patternfly/react-icons/dist/esm/icons/external-link-alt-icon';
import QuestionMarkIcon from '@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon';

import { Spinner } from '@patternfly/react-core'

type Resource = {
  datetimeUploaded: Date;
  datetimeConverted?: Date;
  originalFile: File | null;
  file: File;
  conversionProfile: string;
}

type ResourcePackageGroup = {
  resource: Resource;
  conversionProfile: conversionProfile;
}

type ConversionStepProps = {
  localPort: string;
  returnPort: (port: string) => void;
}

// Later, add workspace file support

const ConversionStep: React.FunctionComponent<ConversionStepProps> = ({ localPort, returnPort }) => {
  const [conversionErrorMessage, setConversionErrorMessage] = useState<string | null>(null);
  const [errorShown, setErrorShown] = useState<boolean>(false);

  const [showConversionProfiles, setShowConversionProfiles] = useState(false);
  const [showDocumentation, setShowDocumentation] = useState(false);

  const workspaceFiles: File[] = [];

  // ------ CARD THINGS ------

  const [conversionRequiredResources, setConversionRequiredResources] = useState<Resource[]>([]);
  const [uploadCompleteResources, setUploadCompleteResources] = useState<Resource[]>([]);

  const [shownConversionRequiredResources, setShownConversionRequiredResources] = useState<Resource[]>([]);
  const [shownUploadCompleteResources, setShownUploadCompleteResources] = useState<Resource[]>([]);

  const [selectedConversionRequiredFileNames, setSelectedConversionRequiredFileNames] = useState<string[]>([]);
  const [selectedUploadCompleteFileNames, setSelectedUploadCompleteFileNames] = useState<string[]>([]);

  const setResourceSelected = (resource: Resource, isSelecting = true, group: string) => {
    if (group === 'conversion-required') {
      setSelectedConversionRequiredFileNames((prevSelected) => {
        const otherSelectedFileNames = prevSelected.filter((file_name) => file_name !== resource.file.name);
        return isSelecting ? [...otherSelectedFileNames, resource.file.name] : otherSelectedFileNames;
      });
    } else if (group === 'upload-complete') {
      setSelectedUploadCompleteFileNames((prevSelected) => {
        const otherSelectedFileNames = prevSelected.filter((file_name) => file_name !== resource.file.name);
        return isSelecting ? [...otherSelectedFileNames, resource.file.name] : otherSelectedFileNames;
      });
    }
  }

  const selectAllFiles = (isSelecting = true, explicitlyAll = false, group: string) => {
    if (group === 'conversion-required') {
      if (explicitlyAll || !isSelecting || areAllShownSelected()) {
        setSelectedConversionRequiredFileNames(isSelecting ? conversionRequiredResources.map((resource) => resource.file.name) : []);
      } else {
        selectPage();
      }
    } else if (group === 'upload-complete') {
      if (explicitlyAll || !isSelecting || areAllShownSelected()) {
        setSelectedUploadCompleteFileNames(isSelecting ? uploadCompleteResources.map((resource) => resource.file.name) : []);
      } else {
        selectPage();
      }
    } else if (group === 'all') {
      setSelectedConversionRequiredFileNames(isSelecting ? conversionRequiredResources.map((resource) => resource.file.name) : []);
      setSelectedUploadCompleteFileNames(isSelecting ? uploadCompleteResources.map((resource) => resource.file.name) : []);
    }

    setSelectFilesDropdownOpen(false);
  }

  const isResourceSelected = (resource: Resource) => [...selectedConversionRequiredFileNames, ...selectedUploadCompleteFileNames].includes(resource.file.name);

  const [recentSelectedRowIndex, setRecentSelectedRowIndex] = useState<number | null>(null);
  const [shifting, setShifting] = useState(false);

  const onSelectResource = (resource: Resource, rowIndex: number, isSelecting: boolean) => {
    if (shifting && recentSelectedRowIndex !== null) {
      const numberSelected = rowIndex - recentSelectedRowIndex;
      const intermediateIndexes =
        numberSelected > 0
          ? Array.from(new Array(numberSelected + 1), (_x, i) => i + recentSelectedRowIndex)
          : Array.from(new Array(Math.abs(numberSelected) + 1), (_x, i) => i + rowIndex);
      intermediateIndexes.forEach((index) => setResourceSelected([...shownConversionRequiredResources, ...shownUploadCompleteResources][index], isSelecting, index < shownConversionRequiredResources.length ? 'conversion-required' : 'upload-complete'));
    } else {
      setResourceSelected(resource, isSelecting, rowIndex < shownConversionRequiredResources.length ? 'conversion-required' : 'upload-complete');
    }
    setRecentSelectedRowIndex(rowIndex);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShifting(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShifting(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const getFileStem = (file: File): string => {
    return file.name.split('.').slice(0, -1).join('.');
  }

  const onUpload = (toOverwrite: File[], toUpload: File[]) => {
    setRecentSelectedRowIndex(null);

    const conversionRequiredClosed = conversionRequiredResources.length == 0;
    const uploadCompleteClosed = uploadCompleteResources.length == 0;

    const newConversionRequiredResources = conversionRequiredResources.filter(
      (resource) => !toOverwrite.some(fileToRemove => getFileStem(fileToRemove) === getFileStem(resource.file))
    );

    const newUploadCompleteResources = uploadCompleteResources.filter(
      (resource) => !toOverwrite.some(fileToRemove => getFileStem(fileToRemove) === getFileStem(resource.file))
    );

    if ((conversionRequiredClosed && [...toOverwrite, ...toUpload].filter((file) => file.type !== 'text/markdown').length == 0) && (!uploadCompleteClosed || [...toOverwrite, ...toUpload].filter((file) => file.type === 'text/markdown').length > 0)) {
      setActiveTabKey('upload-complete');
    } else if ((uploadCompleteClosed && [...toOverwrite, ...toUpload].filter((file) => file.type === 'text/markdown').length == 0) && (!conversionRequiredClosed || [...toOverwrite, ...toUpload].filter((file) => file.type !== 'text/markdown').length > 0)) {
      setActiveTabKey('conversion-required');
    }

    Promise.resolve().then(() => {
      setConversionRequiredResources(() => {
        const selectFiles = [...toOverwrite, ...toUpload].filter((file) => file.type !== 'text/markdown')
        const newResouces = selectFiles.map((file) => {
          return ({
            "datetimeUploaded": new Date(),
            "originalFile": null,
            "file": file,
            "conversionProfile": "Default"
          })
        })
  
        return [...newConversionRequiredResources, ...newResouces];
      })
    }).then(() => {
      setUploadCompleteResources(() => {
        const selectFiles = [...toOverwrite, ...toUpload].filter((file) => file.type === 'text/markdown')
        const newResouces = selectFiles.map((file) => {
          return ({
            "datetimeUploaded": new Date(),
            "originalFile": null,
            "file": file,
            "conversionProfile": "None"
          })
        })
  
        return [...newUploadCompleteResources, ...newResouces];
      })
    })
  }

  const fileTypeTranslations: { [key: string]: string } = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'image/*': 'Image',
    'text/html': 'HTML',
    'text/asciidoc': 'AsciiDoc',
    'text/markdown': 'Markdown'
  }

  const translateFileType = (mimeType: string): string => {
    if (fileTypeTranslations[mimeType]) {
      return fileTypeTranslations[mimeType];
    }

    const [type] = mimeType.split('/');
    const wildcardKey = `${type}/*`;
    if (fileTypeTranslations[wildcardKey]) {
      return fileTypeTranslations[wildcardKey];
    }

    return 'Unknown'
  }

  const sizeForDisplay = (size: number): string => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else if (size < 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  }

  const getfileIcon = (type: string) => {
    let modifiedType = type;

    if (modifiedType.includes('image/')) {
      modifiedType = 'image/*';
    }

    switch (modifiedType) {
      case 'application/pdf':
        return <Icon><FilePDF /></Icon>;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return <Icon><FilePowerpoint /></Icon>;
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        return <Icon><FileWord /></Icon>;
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return <Icon><FileExcel /></Icon>;
      case 'image/*':
        return <Icon><FileImage /></Icon>;
      case 'text/html':
        return <Icon><FileCode /></Icon>;
      case 'text/asciidoc':
        return <Icon><FileAlt /></Icon>;
      case 'text/markdown':
        return <Icon><FileAlt /></Icon>;
      default:
        return <Icon><FileIcon /></Icon>;
    }
  }

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York',
    };
  
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const formattedDate = formatter.format(date);
  
    return `${formattedDate} EST`;
  }

  const [conversionProfiles, setConversionProfiles] = useState<conversionProfile[]>(defaultConversionProfiles);
  const [openProfileDropdown, setOpenProfileDropdown] = useState<string | null>(null);

  const onToggleClick = (name: string) => {
    if (openProfileDropdown === name) {
      setOpenProfileDropdown(null);
    } else {
      setOpenProfileDropdown(name);
    }
  }

  const handleProfileSelect = (resource: Resource, profile: conversionProfile) => {
    setConversionRequiredResources((prevResources) => {
      return prevResources.map((res) => {
        if (res.file.name === resource.file.name) {
          return { ...res, conversionProfile: profile.alias };
        }
        return res;
      });
    });
    setOpenProfileDropdown(null);
  }

  const [openFileActionsDropdown, setOpenFileActionsDropdown] = useState<string | null>(null);

  const onActionsToggleClick = (name: string) => {
    if (openFileActionsDropdown === name) {
      setOpenFileActionsDropdown(null);
    } else {
      setOpenFileActionsDropdown(name);
    }
  }

  const abortControllerRef = useRef<AbortController>(new AbortController());

  const handleFileActionSelect = (resource: Resource, value: string) => {
    if (value === "delete") {
      removeResources([resource]);
    }

    if (value === "view") {
      viewFileInNewTab(resource.file);
    }

    if (value === "view-original") {
      if (resource.originalFile) {
        viewFileInNewTab(resource.originalFile);
      } else {
        viewFileInNewTab(resource.file);
      }
    }

    if (value == "download") {
      downloadFile(resource.file);
    }

    if (value === "download-original") {
      if (resource.originalFile) {
        downloadFile(resource.originalFile);
      } else {
        downloadFile(resource.file);
      }
    }

    if (value === "convert") {
      onConvert([resource]);
    }

    if (value === "revert") {
      const newResource: Resource = {
        "datetimeUploaded": resource.datetimeUploaded,
        "originalFile": null,
        "file": resource.originalFile || resource.file,
        "conversionProfile": resource.conversionProfile
      }

      if (uploadCompleteLengthRef.current == 1) {
        setActiveTabKey('conversion-required');
      }

      setUploadCompleteResources((prev) => prev.filter((res) => res.file.name !== resource.file.name));
      setConversionRequiredResources((prev) => [...prev, newResource]);

      if (selectedUploadCompleteFileNames.includes(resource.file.name)) {
        setSelectedUploadCompleteFileNames((prev) => prev.filter((fileName) => fileName !== resource.file.name));
        setSelectedConversionRequiredFileNames((prev) => [...prev, newResource.file.name]);
      }
    }

    if (value === "cancel-conversion") {
      if (convertingFileNames[0] == resource.file.name) {
        convertingGroups.current.shift();
        abortControllerRef.current.abort();
      } else {
        convertingGroups.current = convertingGroups.current.filter((group) => group.resource.file.name !== resource.file.name);
      }

      setConvertingFileNames(convertingGroups.current.map((group) => group.resource.file.name));
    }

    setOpenFileActionsDropdown(null);
  }

  const removeResources = (resources: Resource[]) => {
    const newConversionRequiredResources = conversionRequiredResources.filter(
      (resource) => !resources.some(resourceToRemove => getFileStem(resourceToRemove.file) === getFileStem(resource.file))
    );

    const newUploadCompleteResources = uploadCompleteResources.filter(
      (resource) => !resources.some(resourceToRemove => getFileStem(resourceToRemove.file) === getFileStem(resource.file))
    );

    const newConversionRequiredSelectedNames = selectedConversionRequiredFileNames.filter(
      (fileName) => !resources.some(resourceToRemove => getFileStem(resourceToRemove.file) === getFileStem({ name: fileName, type: 'text/markdown', size: 0 } as File))
    );

    const newUploadCompleteSelectedNames = selectedUploadCompleteFileNames.filter(
      (fileName) => !resources.some(resourceToRemove => getFileStem(resourceToRemove.file) === getFileStem({ name: fileName, type: 'text/markdown', size: 0 } as File))
    );

    if (newConversionRequiredResources.length === 0 && newUploadCompleteResources.length > 0) {
      setActiveTabKey('upload-complete');
    } else if (newUploadCompleteResources.length === 0 && newConversionRequiredResources.length > 0) {
      setActiveTabKey('conversion-required');
    }

    setConversionRequiredResources(newConversionRequiredResources);
    setUploadCompleteResources(newUploadCompleteResources);
    setSelectedConversionRequiredFileNames(newConversionRequiredSelectedNames);
    setSelectedUploadCompleteFileNames(newUploadCompleteSelectedNames);
  }

  // ------ MODAL THINGS -------

  const handleConversionProfilesClose = () => {
    if (isDangerous && !showSaveWarning) {
      setShowSaveVariant('exit');
      setShowSaveWarning(true);
      return;
    }

    setShowConversionProfiles(false);
    setOpenProfileDropdown(null);
    setViewedProfile(conversionProfiles[0]);
    setInitialViewedProfile(conversionProfiles[0]);
    setAliasErrors([]);
    setPlaceholderErrors([]);
    setShowSaveWarning(false);
    setOpenEditConversionProfileDropdown(null);
  }

  const feignClick = () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.click();
    document.body.removeChild(button);
  }

  const handleConversionProfilesOpen = (create: boolean = false) => {
    setShowConversionProfiles(true);
    setOpenProfileDropdown(null);
    setOpenEditConversionProfileDropdown(null);
    setFileActionsDropdownOpen(false);
    setDownloadDropdownOpen(false);
    setFiltersDropdownOpen(false);
    setConvertDropdownOpen(false);
    setSelectFilesDropdownOpen(false);

    feignClick();

    if (create) {
      setViewedProfile(creationDefault);
      setInitialViewedProfile(creationDefault);
    } else {
      setViewedProfile(conversionProfiles[0]);
      setInitialViewedProfile(conversionProfiles[0]);
    }
  }

  const inspectProfile = (alias: string) => {
    setShowConversionProfiles(true);
    setOpenProfileDropdown(null);
    setOpenEditConversionProfileDropdown(null);
    setFileActionsDropdownOpen(false);
    setDownloadDropdownOpen(false);
    setFiltersDropdownOpen(false);
    setConvertDropdownOpen(false);
    setSelectFilesDropdownOpen(false);

    feignClick();

    const profile = conversionProfiles.find((profile) => profile.alias === alias);

    if (profile) {
      setViewedProfile(profile);
      setInitialViewedProfile(profile);
    }
  }

  const handleFileUploadOpen = () => {
    setOpenProfileDropdown(null);
    setOpenEditConversionProfileDropdown(null);
    setFileActionsDropdownOpen(false);
    setDownloadDropdownOpen(false);
    setFiltersDropdownOpen(false);
    setConvertDropdownOpen(false);
    setSelectFilesDropdownOpen(false);

    feignClick();
  }

  const [showSaveWarning, setShowSaveWarning] = useState(false);
  const [showSaveVariant, setShowSaveVariant] = useState<'change' | 'exit' | 'create'>('exit');
  const [viewedProfile, setViewedProfile] = useState<conversionProfile>(conversionProfiles[0]);
  const [viewedProfileDisplay, setViewedProfileDisplay] = useState<conversionProfileDisplay>(getConversionProfileDisplay(conversionProfiles[0]));
  const [initialViewedProfile, setInitialViewedProfile] = useState<conversionProfile>(conversionProfiles[0]);
  const [aliasErrors, setAliasErrors] = useState<string[]>([]);
  const [placeholderErrors, setPlaceholderErrors] = useState<string[]>([]);
  const [nextProfileAlias, setNextProfileAlias] = useState<string>("");

  const hasErrors = aliasErrors.length > 0 || placeholderErrors.length > 0 || viewedProfile.alias.length === 0;
  const hasChanged = !equivalentConversionProfiles(viewedProfile, initialViewedProfile);
  const isDangerous = hasChanged || initialViewedProfile.alias === "";

  useEffect(() => {
    setViewedProfileDisplay(getConversionProfileDisplay(viewedProfile));
  }, [viewedProfile]);

  const maxAliasCharacters = 30;
  const maxPlaceholderCharacters = 200;

  const onProfileSelect = (_event: any, itemId: any) => {
    if (isDangerous && !showSaveWarning) {
      setNextProfileAlias(itemId);
      setShowSaveVariant('change');
      setShowSaveWarning(true);
      return;
    }

    settingsViewContainerRef.current?.scrollTo({ top: 0 });
    setAliasErrors([]);
    setPlaceholderErrors([]);
    setOpenEditConversionProfileDropdown(null);

    const profile = conversionProfiles.find((profile) => profile.alias === itemId);
    
    if (profile) {
      setViewedProfile(profile);
      setInitialViewedProfile(profile);
    }

    setShowSaveWarning(false);
  }

  const getErrors = (value: string | boolean, accessor: keyof conversionProfile): boolean => {
    if (accessor === "alias") {
      const newAlias = value as string;
      let errors: string[] = [];

      if (newAlias.trim() === "") {
        errors.push("Please enter an alias");
      }

      if (conversionProfiles.map(profile => profile.alias).includes(newAlias) && newAlias !== initialViewedProfile.alias) {
        errors.push(`The alias "${newAlias}" is already in use`);
      }

      if (newAlias.length > maxAliasCharacters) {
        errors.push(`${newAlias.length}/${maxAliasCharacters} characters`)
      }

      setAliasErrors(errors);

      return errors.length > 0;
    } else if (accessor === "md_page_break_placeholder") {
      const newPlaceholder = value as string;
      let errors: string[] = [];

      if (newPlaceholder.length > maxPlaceholderCharacters) {
        errors.push(`${newPlaceholder.length}/${maxPlaceholderCharacters} characters`)
      }

      setPlaceholderErrors(errors);
      
      return errors.length > 0;
    } 

    return false;
  }

  const handleViewedProfileChange = (value: string | boolean, accessor: keyof conversionProfile) => {
    setOpenEditConversionProfileDropdown(null);
    
    if (accessor === "alias") {
      const newAlias = value as string;

      getErrors(newAlias, accessor);
      setViewedProfile(prev => ({ ...prev, [accessor]: newAlias }));
    } else if (accessor === "md_page_break_placeholder") {
      const newPlaceholder = value as string;
      
      getErrors(newPlaceholder, accessor);
      setViewedProfile(prev => ({ ...prev, [accessor]: newPlaceholder }));
    } else {
      setViewedProfile(prev => ({ ...prev, [accessor]: value }));
    }
  }

  const settingsViewContainerRef =  useRef<HTMLDivElement | null>(null);

  const [openEditConversionProfileDropdown, setOpenEditConversionProfileDropdown] = useState<string | null>(null);

  const imageExportModeOptions = [
    {"value": "embedded", "display": "Embedded"},
    {"value": "placeholder", "display": "Placeholder"},
    {"value": "referenced", "display": "Referenced"}
  ];
  const pipelineOptions = [
    {"value": "standard", "display": "Standard"},
    {"value": "vlm", "display": "VLM"}
  ]
  const ocrEngineOptions = [
    {"value": "easyocr", "display": "EasyOCR"},
    {"value": "tesserocr", "display": "Tesseract CLI"},
    {"value": "tesseract", "display": "Tesseract"},
    {"value": "rapidocr", "display": "RapidOCR"},
    {"value": "ocrmac", "display": "OCRMac"}
  ]
  const pdfBackendOptions = [
    {"value": "pypdfium2", "display": "pypdfium2"},
    {"value": "dlparse_v1", "display": "dlparse_v1"},
    {"value": "dlparse_v2", "display": "dlparse_v2"},
    {"value": "dlparse_v4", "display": "dlparse_v4"}
  ]
  const tableModeOptions = [
    {"value": "fast", "display": "Fast"},
    {"value": "accurate", "display": "Accurate"}
  ]

  const handleCreateClick = () => {
    if (initialViewedProfile.alias !== "") {
      if (isDangerous && !showSaveWarning) {
        setShowSaveVariant('create');
        setShowSaveWarning(true);
        return;

      }

      setAliasErrors([]);
      setPlaceholderErrors([]);
      setViewedProfile(creationDefault);
      setInitialViewedProfile(creationDefault);
      setOpenEditConversionProfileDropdown(null);
      setShowSaveWarning(false);
    }
  }

  const handleCreateProfile = () => {
    if (!getErrors(viewedProfile.alias, 'alias') && !getErrors(viewedProfile.md_page_break_placeholder, 'md_page_break_placeholder')) {
      setConversionProfiles((prev) => [...prev, viewedProfile]);
      setInitialViewedProfile(viewedProfile);
    }
  }

  const handleSaveProfile = () => {
    if (!getErrors(viewedProfile.alias, 'alias') && !getErrors(viewedProfile.md_page_break_placeholder, 'md_page_break_placeholder')) {
      setConversionProfiles((prev) => prev.map((profile) => profile.alias === initialViewedProfile.alias ? viewedProfile : profile));
      setInitialViewedProfile(viewedProfile);
      setConversionRequiredResources((prevResources => prevResources.map((resource) => {
        if (resource.conversionProfile === initialViewedProfile.alias) {
          return { ...resource, conversionProfile: viewedProfile.alias };
        }
        return resource;
      })));
    }
  }

  const handleResetChanges = () => {
    setAliasErrors([]);
    setPlaceholderErrors([]);
    setViewedProfile(initialViewedProfile);
    setOpenEditConversionProfileDropdown(null);
  }

  const handleDiscardChanges = () => {
    if (showSaveVariant === 'exit') {
      handleConversionProfilesClose();
    }

    if (showSaveVariant === 'change') {
      onProfileSelect(null, nextProfileAlias);
    }

    if (showSaveVariant === 'create') {
      handleCreateClick();
    }
  }

  const handleDismissWarning = () => {
    setShowSaveWarning(false);
  }

  // ------ TOOLBAR THINGS ------

  const totalFiles = conversionRequiredResources.length + uploadCompleteResources.length;
  const numFilesSelected = selectedConversionRequiredFileNames.length + selectedUploadCompleteFileNames.length;

  const [selectFilesDropdownOpen, setSelectFilesDropdownOpen] = useState(false);
  const [fileActionsDropdownOpen, setFileActionsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setRecentSelectedRowIndex(null);
  }, [searchQuery]);

  // ------ DRILLDOWN -------

  const [menuDrilledIn, setMenuDrilledIn] = useState<string[]>([]);
  const [drilldownPath, setDrilldownPath] = useState<string[]>([]);
  const [menuHeights, setMenuHeights] = useState<any>({});
  const [activeMenu, setActiveMenu] = useState<string>('drilldown-rootMenu');
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const drillIn = (
    _event: React.KeyboardEvent | React.MouseEvent,
    fromMenuId: string,
    toMenuId: string,
    pathId: string
  ) => {
    setMenuDrilledIn([...menuDrilledIn, fromMenuId]);
    setDrilldownPath([...drilldownPath, pathId]);
    setActiveMenu(toMenuId);
  };

  const drillOut = (_event: React.KeyboardEvent | React.MouseEvent, toMenuId: string) => {
    const menuDrilledInSansLast = menuDrilledIn.slice(0, menuDrilledIn.length - 1);
    const pathSansLast = drilldownPath.slice(0, drilldownPath.length - 1);
    setMenuDrilledIn(menuDrilledInSansLast);
    setDrilldownPath(pathSansLast);
    setActiveMenu(toMenuId);
  };

  const handleActionProfileSelect = (profile: conversionProfile, convert?: boolean) => {
    if (numFilesSelected > 0) {
      const newConversionRequiredResources = conversionRequiredResources.map((resource) => selectedConversionRequiredFileNames.includes(resource.file.name) && !convertingFileNames.includes(resource.file.name) ? { ...resource, conversionProfile: profile.alias } : resource);
      setConversionRequiredResources(newConversionRequiredResources);

      if (convert) {
        handleConvert(newConversionRequiredResources);
      }
    }

    setFileActionsDropdownOpen(false);
  }

  const handleDeleteFiles = () => {
    setFileActionsDropdownOpen(false);

    if (numFilesSelected > 0) {
      const resourcesToDelete = [...conversionRequiredResources, ...uploadCompleteResources].filter((resource) => !convertingFileNames.includes(resource.file.name) && (selectedConversionRequiredFileNames.includes(resource.file.name) || selectedUploadCompleteFileNames.includes(resource.file.name)));
      removeResources(resourcesToDelete);
    }
  }

  const setHeight = (menuId: string, height: number) => {
    if (menuHeights[menuId] === undefined || (menuId !== 'rootMenu' && menuHeights[menuId] !== height)) {
      setMenuHeights({ ...menuHeights, [menuId]: height });
    }
  };

  // ------ CONVERSION --------

  const [convertingFileNames, setConvertingFileNames] = useState<string[]>([]);


  const numDeleteableFiles = selectedConversionRequiredFileNames.filter(name => !convertingFileNames.includes(name)).length + selectedUploadCompleteFileNames.length;
  const numConvertableFiles = selectedConversionRequiredFileNames.filter(name => !convertingFileNames.includes(name)).length;
  const numAllConvertableFiles = conversionRequiredResources.filter(resource => !convertingFileNames.includes(resource.file.name)).length;
  const numConvertingFiles = selectedConversionRequiredFileNames.filter(name => convertingFileNames.includes(name)).length;

  const selectedConversionRequiredFileNamesRef = useRef<string[]>(selectedConversionRequiredFileNames);
  const conversionRequriedLengthRef = useRef<number>(0);
  const uploadCompleteLengthRef = useRef<number>(0);
  const convertingGroups = useRef<ResourcePackageGroup[]>([]);

  useEffect(() => {
    selectedConversionRequiredFileNamesRef.current = selectedConversionRequiredFileNames;
  }, [selectedConversionRequiredFileNames]);

  useEffect(() => {
    conversionRequriedLengthRef.current = conversionRequiredResources.length;
  }, [conversionRequiredResources]);

  useEffect(() => {
    uploadCompleteLengthRef.current = uploadCompleteResources.length;
  }, [uploadCompleteResources]);

  const addConvertedResource = (resource: Resource) => {
    if (conversionRequriedLengthRef.current === 1) {
      setActiveTabKey('upload-complete');
    }

    setConversionRequiredResources((prev) => prev.filter((res) => res.file.name !== resource.originalFile?.name));
    setUploadCompleteResources((prev) => [...prev, resource]);
    setConvertingFileNames((prev) => prev.filter((fileName) => fileName !== resource.originalFile?.name));

    setSelectedConversionRequiredFileNames((prev) => prev.filter((fileName) => fileName !== resource.originalFile?.name));
  }

  const onConvert = async (toConvert: Resource[]) => {
    const toConvertGroups = toConvert.filter((resource => !convertingFileNames.includes(resource.file.name))).map((resource) => {
      const profile = conversionProfiles.find((profile) => profile.alias === resource.conversionProfile) || conversionProfiles[0];

      return {
        resource: resource,
        conversionProfile: profile
      }
    })

    if (toConvertGroups.length) {
      if (convertingGroups.current.length === 0) {
        setConvertingFileNames(toConvert.map((resource) => resource.file.name));
        convertingGroups.current = toConvertGroups;
  
        await convertFilesToMarkdownWithOptions(
          convertingGroups,
          abortControllerRef,
          () => false,
          addConvertedResource,
          (message: string) => {setConversionErrorMessage(message)},
          start,
          reset,
          localPort
        )
      } else {
        convertingGroups.current.push(...toConvertGroups);
        setConvertingFileNames((prev) => [...prev, ...toConvert.map((resource) => resource.file.name)]);
      }
    }
  }

  const handleConvert = (newResources?: Resource[]) => {
    let conversionResources = conversionRequiredResources;
    
    if (newResources) {
      conversionResources = newResources;
    }

    setConvertDropdownOpen(false);
    onConvert(conversionResources.filter((resource) => selectedConversionRequiredFileNames.includes(resource.file.name)));
  }

  const handleConvertAll = () => {
    setConvertDropdownOpen(false);
    onConvert(conversionRequiredResources);
  }

  const handleCancelConversion = () => {
    setFileActionsDropdownOpen(false);

    const toCancelNames = selectedConversionRequiredFileNames.filter(name => convertingFileNames.includes(name));
    const frontName = convertingGroups.current[0]?.resource.file.name;

    convertingGroups.current = convertingGroups.current.filter((group) => !toCancelNames.includes(group.resource.file.name));

    if (frontName && toCancelNames.includes(frontName)) {
      abortControllerRef.current.abort();
    }

    setConvertingFileNames(convertingGroups.current.map((group) => group.resource.file.name));
  }

  // ------ VIEW -------

  const viewFileInNewTab = (file: File) => {
    const fileURL = URL.createObjectURL(file);
    window.open(fileURL, '_blank')?.focus();
  }

  // ------ DOWNLOAD ------

  const handleDownloadFiles = () => {
    const files = [...conversionRequiredResources, ...uploadCompleteResources].filter((resource) => selectedConversionRequiredFileNames.includes(resource.file.name) || selectedUploadCompleteFileNames.includes(resource.file.name)).map((resource) => resource.file);
    
    if (files.length === 0) {
      setFileActionsDropdownOpen(false);
      return;
    }

    if (files.length === 1) {
      downloadFile(files[0]);
      setFileActionsDropdownOpen(false);
      return;
    }

    downloadFilesAsZip(
      [...conversionRequiredResources, ...uploadCompleteResources].filter((resource) => selectedConversionRequiredFileNames.includes(resource.file.name) || selectedUploadCompleteFileNames.includes(resource.file.name)).map((resource) => resource.file),
      'documents.zip'
    );
    setFileActionsDropdownOpen(false);
  }

  const handleDownloadOriginalFiles = () => {
    const files = revertableSelection.map((resource) => resource.originalFile || resource.file);

    if (files.length === 0) {
      setFileActionsDropdownOpen(false);
      return;
    }

    if (files.length === 1) {
      downloadFile(files[0]);
      setFileActionsDropdownOpen(false);
      return;
    }

    downloadFilesAsZip(
      revertableSelection.map((resource) => resource.originalFile || resource.file),
      'original_documents.zip'
    );
    setFileActionsDropdownOpen(false);
  }

  const downloadFile = (file: File) => {
    const fileURL = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = fileURL;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(fileURL);
  };

  const downloadFilesAsZip = async (files: File[], zipName = 'ingested_documents.zip') => {
    if (files.length === 0) {
      setDownloadDropdownOpen(false);
      return;
    }
    
    if (files.length === 1) {
      downloadFile(files[0]);
      return;
    }

    const zip = new JSZip();
  
    for (const file of files) {
      const fileData = await file.arrayBuffer();
      zip.file(file.name, fileData);
    }
  
    const blob = await zip.generateAsync({ type: 'blob' });
  
    const link = document.createElement('a');
    const blobURL = URL.createObjectURL(blob);
    link.href = blobURL;
    link.download = zipName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobURL);
  };

  // ------ TOOLBAR DISABLES ------
  
  const selectionConvertable = selectedConversionRequiredFileNames.filter(name => !convertingFileNames.includes(name)).length > 0;
  const revertableSelection = uploadCompleteResources.filter((resource) => resource.originalFile != null && selectedUploadCompleteFileNames.includes(resource.file.name));
  const selectionRevertable = revertableSelection.length > 0;
  const selectionConverting = numConvertingFiles > 0;

  const handleRevert = () => {
    setFileActionsDropdownOpen(false);

    if (revertableSelection.length === uploadCompleteLengthRef.current) {
      setActiveTabKey('conversion-required');
    }

    for (const resource of revertableSelection) {
      if (resource.originalFile) {
        const newResource: Resource = {
          "datetimeUploaded": resource.datetimeUploaded,
          "originalFile": null,
          "file": resource.originalFile || resource.file,
          "conversionProfile": resource.conversionProfile
        }

        setUploadCompleteResources((prev) => prev.filter((res) => res.file.name !== resource.file.name));
        setConversionRequiredResources((prev) => [...prev, newResource]);

        if (selectedUploadCompleteFileNames.includes(resource.file.name)) {
          setSelectedUploadCompleteFileNames((prev) => prev.filter((fileName) => fileName !== resource.file.name));
          setSelectedConversionRequiredFileNames((prev) => [...prev, newResource.file.name]);
        }
      }
    }
  }

  // ------ ACTIONS MENU DEFAULTS ------

  const handleConvertToggle = (isOpen: boolean) => {
    if (isOpen) {
      setMenuDrilledIn([]);
      setDrilldownPath([]);
      setActiveMenu('drilldown-rootMenu');
    }

    setConvertDropdownOpen(isOpen)
  }

  // ------ TIMER ------

  const { elapsed, isRunning, start, pause, reset } = useTimer();

  // ------ TABS ------

  const [activeTabKey, setActiveTabKey] = useState<string | number>('conversion-required');

  const handleTabClick = (
    event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    tabIndex: string | number
  ) => {
    setPage(1);
    setActiveTabKey(tabIndex);
    setRecentSelectedRowIndex(null);
  }

  // ------ PAGINATION ------

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const onSetPage = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPage: number) => {
    setPage(newPage);
  }

  const onPerPageSelect = (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPerPage: number,
    newPage: number
  ) => {
    setPerPage(newPerPage);
    setPage(Math.max(1, newPage));
  };

  const shownConversionRequiredResourcesLength = shownConversionRequiredResources.length;
  const shownUploadCompleteResourcesLength = shownUploadCompleteResources.length;

  useEffect(() => {
    if (activeTabKey === 'conversion-required') {
      setSelectedUploadCompleteFileNames([]);

      if ((page - 1) * perPage >= shownConversionRequiredResourcesLength) {
        setPage(Math.max(1, Math.ceil(shownConversionRequiredResourcesLength / perPage)));
      }
    } else if (activeTabKey === 'upload-complete') {
      setSelectedConversionRequiredFileNames([]);

      if ((page - 1) * perPage >= shownUploadCompleteResourcesLength) {
        setPage(Math.max(1, Math.ceil(shownUploadCompleteResourcesLength / perPage)));
      }
    }
  }, [shownConversionRequiredResourcesLength, shownUploadCompleteResourcesLength, activeTabKey]);

  // ------ LEARN MORE ------

  const handleLearnMoreClick = () => {
    const link = document.createElement('a');
    link.href = "https://github.com/fabianofranz/docling-conversion-tutorials/tree/main"
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ------ DOWNLOAD DROPDOWN ------

  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);


  // ------ CONVERT DROPDOWN ------

  const [convertDropdownOpen, setConvertDropdownOpen] = useState(false);

  // ------ CLOSING MENUS ------

  useEffect(() => {
    if (conversionErrorMessage) {
      convertingGroups.current = [];
      setConvertingFileNames([]);
      setOpenProfileDropdown(null);
      setOpenEditConversionProfileDropdown(null);
      setFileActionsDropdownOpen(false);
      setDownloadDropdownOpen(false);
      setFiltersDropdownOpen(false);
      setConvertDropdownOpen(false);
      setSelectFilesDropdownOpen(false);

      feignClick();
    }
  }, [conversionErrorMessage]);

  // ------ TAB-SPECIFIC ------

  const totalPageFiles = activeTabKey === 'conversion-required' ? conversionRequiredResources.length : uploadCompleteResources.length;
  const totalShownPageFiles = activeTabKey === 'conversion-required' ? shownConversionRequiredResources.length : shownUploadCompleteResources.length;
  const numPageFilesSelected = activeTabKey === 'conversion-required' ? selectedConversionRequiredFileNames.length : selectedUploadCompleteFileNames.length;

  // ------ EXPANDED BULK SELECT ------

  const selectPage = () => {
    if (activeTabKey === 'conversion-required') {
      setSelectedConversionRequiredFileNames(prev => [... new Set([...prev, ...shownConversionRequiredResources.slice((page - 1) * perPage, Math.min(page * perPage, conversionRequriedLengthRef.current)).map((resource) => resource.file.name)])]);
    } else {
      setSelectedUploadCompleteFileNames(prev => [... new Set([...prev, ...shownUploadCompleteResources.slice((page - 1) * perPage, Math.min(page * perPage, uploadCompleteLengthRef.current)).map((resource) => resource.file.name)])]);
    }

    setSelectFilesDropdownOpen(false);
  }

  const selectFiltered = () => {
    if (activeTabKey === 'conversion-required') {
      setSelectedConversionRequiredFileNames(prev => [... new Set([...prev, ...shownConversionRequiredResources.map((resource) => resource.file.name)])]);
    } else {
      setSelectedUploadCompleteFileNames(prev => [... new Set([...prev, ...shownUploadCompleteResources.map((resource) => resource.file.name)])]);
    }

    setSelectFilesDropdownOpen(false);
  }

  // ------ DELETE CONVERSION PROFILES ------

  const [showDeleteProfileWarning, setShowDeleteProfileWarning] = useState(false);

  const handleDeleteProfile = () => {
    setShowDeleteProfileWarning(true);
  }

  const handleDismissDeleteProfileWarning = () => {
    setShowDeleteProfileWarning(false);
  }

  const handleConfirmDeleteProfile = () => {
    setConversionProfiles((prev) => prev.filter((profile) => profile.alias !== viewedProfile.alias));
    setViewedProfile(conversionProfiles[0]);
    setInitialViewedProfile(conversionProfiles[0]);
    setShowDeleteProfileWarning(false);
    setAliasErrors([]);
    setPlaceholderErrors([]);
    setOpenEditConversionProfileDropdown(null);

    setConversionRequiredResources((prev) => prev.map((resource) => {
      if (resource.conversionProfile === viewedProfile.alias) {
        return { ...resource, conversionProfile: conversionProfiles[0].alias };
      }
      return resource;
    }));
  }

  // ------ FILTERS ------

  const [selectedFilterValues, setSelectedFilterValues] = useState<string[]>([]);

  const fileTypeOptions = [
    'PDF',
    'DOCX',
    'PPTX',
    'XLSX',
    'Image',
    'HTML',
    'AsciiDoc',
    'Markdown',
    'Unknown'
  ]

  const sourceOptions = [
    'Uploaded',
    'Converted'
  ]

  useEffect(() => {
    if (activeTabKey === 'conversion-required') {
      setShownConversionRequiredResources(applyFilter(conversionRequiredResources.filter((resource) => resource.file.name.toLowerCase().includes(searchQuery.toLowerCase()))));
    }
  }, [selectedFilterValues, conversionRequiredResources, searchQuery]);

  useEffect(() => {
    if (activeTabKey === 'upload-complete') {
      setShownUploadCompleteResources(applyFilter(uploadCompleteResources.filter((resource) => resource.file.name.toLowerCase().includes(searchQuery.toLowerCase()))));
    }
  }, [selectedFilterValues, uploadCompleteResources, searchQuery]);

  useEffect(() => {
    setPage(1);

    if (activeTabKey === 'conversion-required') {
      setSelectedFilterValues([...fileTypeOptions]);
    } else {
      setSelectedFilterValues([...sourceOptions]);
    }

    setRecentSelectedFilterIndex(null);
  }, [activeTabKey])

  const applyFilter = (resources: Resource[]) => {
    if (activeTabKey === 'conversion-required') {
      return resources.filter((resource) => selectedFilterValues.includes(translateFileType(resource.file.type)));
    } else {
      return resources.filter((resource) => selectedFilterValues.includes(resource.datetimeConverted ? 'Converted' : 'Uploaded'));
    }
  }

  const [filtersDropdownOpen, setFiltersDropdownOpen] = useState(false);
  const [recentSelectedFilterIndex, setRecentSelectedFilterIndex] = useState<number | null>(null);

  const toggleFilterOption = (option: string, index: number) => {
    if (shifting && recentSelectedFilterIndex != null) {
      let valuesRange: string[] = [];

      if (recentSelectedFilterIndex > index) {
        valuesRange = activeTabKey === 'conversion-required' ? fileTypeOptions.slice(index, recentSelectedFilterIndex + 1) : sourceOptions.slice(index, recentSelectedFilterIndex + 1);
      } else {
        valuesRange = activeTabKey === 'conversion-required' ? fileTypeOptions.slice(recentSelectedFilterIndex, index + 1) : sourceOptions.slice(recentSelectedFilterIndex, index + 1);
      }

      if (selectedFilterValues.includes(option)) {
        setSelectedFilterValues((prev) => prev.filter((value) => !valuesRange.includes(value)));
      } else {
        setSelectedFilterValues((prev) => [... new Set([...prev, ...valuesRange])]);
      }
    } else {
      setSelectedFilterValues((prev) => {
        if (prev.includes(option)) {
          return prev.filter((value) => value !== option);
        } else {
          return [...prev, option];
        }
      });
    }

    setRecentSelectedFilterIndex(index);
  }

  // ------ ALL SHOWN SELECTED ------

  const areAllShownSelected = () => {
    if (activeTabKey === 'conversion-required') {
      return shownConversionRequiredResources.length > 0 && shownConversionRequiredResources.slice((page - 1) * perPage, Math.min(page * perPage, shownConversionRequiredResources.length)).every((resource) => selectedConversionRequiredFileNames.includes(resource.file.name));
    } else {
      return shownUploadCompleteResources.length > 0 && shownUploadCompleteResources.slice((page - 1) * perPage, Math.min(page * perPage, shownUploadCompleteResources.length)).every((resource) => selectedUploadCompleteFileNames.includes(resource.file.name));
    }
  }

  return (
    <>
      <ConversionHeader openConversionProfiles={handleConversionProfilesOpen} setShowDocumentation={setShowDocumentation} />
      <Flex style={{ marginTop: '4rem', width: '100%' }}>
        <FlexItem style={{width: '20rem'}} alignSelf={{ default: 'alignSelfFlexStart'}}>
          <FileUpload
            workspaceFiles={workspaceFiles}
            pageFiles={[...conversionRequiredResources.map((r) => r.file), ...uploadCompleteResources.map((r) => r.file)]}
            setResources={onUpload}
            onOpen={handleFileUploadOpen}
          />
        </FlexItem>
        <FlexItem flex={{ default: 'flex_1' }} alignSelf={{ default: 'alignSelfFlexStart'}}>
          <Card>
            <CardTitle>
              <Flex>
                <FlexItem>
                  Uploaded Resources
                </FlexItem>
                <FlexItem>
                  <Badge style={{ transform: 'translateY(-2.5px)' }} screenReaderText="Uploaded Resources">{[...conversionRequiredResources, ...uploadCompleteResources].length}</Badge>
                </FlexItem>
              </Flex>

              <Toolbar style={{ marginTop: '2.5rem' }}>
                <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} style={{ width: '100%', padding: '0 0.5rem'}}>
                  <FlexItem>
                    <ToolbarContent>
                    <ToolbarItem key="checkbox">
                      <Dropdown
                        isOpen={selectFilesDropdownOpen}
                        onSelect={() => setSelectFilesDropdownOpen(true)}
                        onOpenChange={(isOpen: boolean) => setSelectFilesDropdownOpen(isOpen)}
                        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                            <MenuToggle
                              className="select-files-toggle"
                              ref={toggleRef}
                              onClick={() => setSelectFilesDropdownOpen(!selectFilesDropdownOpen)}
                              isExpanded={selectFilesDropdownOpen}
                              splitButtonItems={[
                                <MenuToggleCheckbox 
                                  key="split-button-checkbox" 
                                  id="split-button-checkbox"
                                  onChange={(isSelecting) => selectAllFiles(isSelecting, false, activeTabKey as string)}
                                  isChecked={numPageFilesSelected == 0 ? false : numPageFilesSelected === totalPageFiles ? true : null}
                                />
                              ]}
                            >
                              {numPageFilesSelected > 0 ? `${numPageFilesSelected} selected` : ''}
                            </MenuToggle>
                        )}
                        shouldFocusToggleOnSelect
                      >
                        <DropdownList>
                          <DropdownItem
                            value={0}
                            key="select-none"
                            onClick={() => selectAllFiles(false, true, activeTabKey as string)}
                          >
                            Select none (0)
                          </DropdownItem>
                          <DropdownItem
                            value={1}
                            key="select-page"
                            onClick={selectPage}
                          >
                            Select shown ({Math.min(perPage, totalShownPageFiles - ((page - 1) * perPage))})
                          </DropdownItem>
                          <DropdownItem
                            value={2}
                            key="select-filtered"
                            onClick={selectFiltered}
                          >
                            Select filtered ({totalShownPageFiles})
                          </DropdownItem>
                          <DropdownItem
                            value={3}
                            key="select-all"
                            onClick={() => selectAllFiles(true, true, activeTabKey as string)}
                          >
                            Select all ({activeTabKey === 'conversion-required' ? conversionRequriedLengthRef.current : uploadCompleteLengthRef.current})
                          </DropdownItem>
                        </DropdownList>
                      </Dropdown>
                    </ToolbarItem>
                    <ToolbarItem key="search">
                      <SearchInput 
                        placeholder="Find by name"
                        value={searchQuery}
                        onChange={(_event, value) => setSearchQuery(value)}
                        onClear={() => setSearchQuery('')}
                      />
                    </ToolbarItem>
                    <ToolbarItem key="filters">
                    <Dropdown
                        isOpen={filtersDropdownOpen}
                        onSelect={() => setFiltersDropdownOpen(true)}
                        onOpenChange={(isOpen: boolean) => {setFiltersDropdownOpen(isOpen)}}
                        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                          <MenuToggle className="filters-menu" ref={toggleRef} onClick={() => setFiltersDropdownOpen(!filtersDropdownOpen)} isExpanded={filtersDropdownOpen}>
                            {activeTabKey == 'conversion-required' ? 'File Types' : 'Source'} <Badge className='filters-badge' isRead screenReaderText="Selected Filters">{selectedFilterValues.length}</Badge>
                          </MenuToggle>
                        )}
                        ouiaId="FiltersDropdown"
                        shouldFocusToggleOnSelect
                      >
                        <DropdownList className='filters-dropdown-list'>
                          {activeTabKey === 'conversion-required' ? (
                            <>
                              {fileTypeOptions.map((fileType, index) => (
                                <MenuItem
                                  key={index}
                                  className='file-type-option'
                                  itemId={fileType}
                                  onClick={() => toggleFilterOption(fileType, index)}
                                >
                                  <Checkbox
                                    className='filter-checkbox'
                                    id='checkbox'
                                    isChecked={selectedFilterValues.includes(fileType)}
                                    onChange={() =>{}}
                                  />
                                  {fileType}
                                </MenuItem>
                              ))}
                            </>
                          ) : (
                            <>
                              {sourceOptions.map((source, index) => (
                                <MenuItem
                                  key={index}
                                  className='source-option'
                                  itemId={source}
                                  onClick={() => toggleFilterOption(source, index)}
                                >
                                  <Checkbox
                                    className='filter-checkbox'
                                    id='checkbox'
                                    isChecked={selectedFilterValues.includes(source)}
                                    onChange={() =>{}}
                                  />
                                  {source}
                                </MenuItem>
                              ))}
                            </>
                          )}
                        </DropdownList>
                      </Dropdown>
                    </ToolbarItem>
                    { activeTabKey === 'conversion-required' && (
                      <ToolbarItem key="convert-button">
                        <MenuContainer
                          isOpen={convertDropdownOpen}
                          onOpenChange={(isOpen: boolean) => handleConvertToggle(isOpen)}
                          menu={
                            <Menu
                              id="rootMenu"
                              containsDrilldown
                              drilldownItemPath={drilldownPath}
                              drilledInMenus={menuDrilledIn}
                              activeMenu={activeMenu}
                              onDrillIn={drillIn}
                              onDrillOut={drillOut}
                              onGetMenuHeight={setHeight}
                              ref={menuRef}
                            >
                              <MenuContent menuHeight={`${menuHeights[activeMenu]}px`}>
                                <MenuList>
                                  <MenuItem
                                    itemId="group:set-conversion-profile"
                                    direction="down"
                                    isDisabled={!selectionConvertable}
                                    drilldownMenu={
                                      <DrilldownMenu id="drilldownMenuStart">
                                        <MenuItem itemId="group:set-conversion-profile_breadcrumb" direction="up">
                                          Convert with profile ({selectedConversionRequiredFileNames.length})
                                        </MenuItem>
                                        <Divider component="li" key="separator" />
                                        <MenuList className="conversion-profile-dropdown">
                                          {conversionProfiles.map((profile, idx) => (
                                            <MenuItem
                                              value={idx}
                                              key={idx}
                                              itemId={`conversion-profile-${idx}`}
                                              onClick={() => handleActionProfileSelect(profile, true)}
                                            >
                                              {profile.alias}
                                            </MenuItem>
                                          ))}
                                        </MenuList>
                                        <Divider component="li" key="separator-2" />
                                        <MenuItem
                                          value={conversionProfiles.length}
                                          key="create"
                                          itemId='create-conversion-profile'
                                          onClick={() => handleConversionProfilesOpen(true)}
                                        >
                                          Create conversion profile
                                        </MenuItem>
                                      </DrilldownMenu>
                                    }
                                  >
                                    Convert with profile ({numConvertableFiles})
                                  </MenuItem>
                                  <MenuItem
                                    itemId="convert-files"
                                    onClick={handleConvert}
                                    isDisabled={!selectionConvertable}
                                  >
                                    Convert files ({numConvertableFiles})
                                  </MenuItem>
                                  <MenuItem
                                    itemId="convert-files"
                                    onClick={handleConvertAll}
                                    className="blue-item"
                                    isDisabled={numAllConvertableFiles === 0}
                                  >
                                    Convert all files ({numAllConvertableFiles})
                                  </MenuItem>
                                </MenuList>
                              </MenuContent>
                            </Menu>
                          }
                          menuRef={menuRef}
                          toggle={
                            <MenuToggle
                              variant="primary"
                              splitButtonItems={[
                                <MenuToggleAction
                                  id='convert-action'
                                  key='convert-action'
                                  aria-label='Convert selected files'
                                  onClick={() => handleConvert()}
                                >
                                  Convert
                                </MenuToggleAction>
                              ]}
                              ref={toggleRef}
                              onClick={() => handleConvertToggle(!convertDropdownOpen)}
                              isExpanded={convertDropdownOpen}
                            />
                          }
                          toggleRef={toggleRef}
                        />
                      </ToolbarItem>
                    )}
                    <ToolbarItem key="download-menu">
                      {activeTabKey === 'conversion-required' ? (
                        <Dropdown
                          isOpen={downloadDropdownOpen}
                          onSelect={() => setDownloadDropdownOpen(true)}
                          onOpenChange={(isOpen: boolean) => {setDownloadDropdownOpen(isOpen)}}
                          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                            <MenuToggle variant='secondary' className="download-menu" ref={toggleRef} onClick={() => setDownloadDropdownOpen(!downloadDropdownOpen)} isExpanded={downloadDropdownOpen}>
                              Download
                            </MenuToggle>
                          )}
                          ouiaId="DownloadDropdown"
                          shouldFocusToggleOnSelect
                        >
                          <DropdownList>
                            <MenuItem
                              itemId="download-files"
                              onClick={handleDownloadFiles}
                              isDisabled={numFilesSelected === 0}
                            >
                              Download files ({numFilesSelected})
                            </MenuItem>
                            <MenuItem
                              className='blue-item'
                              itemId="download-all-files"
                              onClick={() => downloadFilesAsZip(activeTabKey === 'conversion-required' ? conversionRequiredResources.map((resource) => resource.file) : uploadCompleteResources.map((resource) => resource.file))}
                            >
                              Download all files ({totalPageFiles})
                            </MenuItem>
                          </DropdownList>
                        </Dropdown>
                      ) : (
                        <Dropdown
                          isOpen={downloadDropdownOpen}
                          onSelect={() => setDownloadDropdownOpen(true)}
                          onOpenChange={(isOpen: boolean) => {setDownloadDropdownOpen(isOpen)}}
                          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                            <MenuToggle
                              variant="primary"
                              splitButtonItems={[
                                <MenuToggleAction
                                  id='download-action'
                                  key='download-action'
                                  aria-label='Download selected files'
                                  onClick={() => handleDownloadFiles()}
                                >
                                  Download
                                </MenuToggleAction>
                              ]}
                              ref={toggleRef}
                              onClick={() => setDownloadDropdownOpen(!downloadDropdownOpen)}
                              isExpanded={downloadDropdownOpen}
                            />
                          )}
                          ouiaId="DownloadDropdown"
                          shouldFocusToggleOnSelect
                        >
                          <DropdownList>
                            <MenuItem
                              itemId="download-files"
                              onClick={handleDownloadFiles}
                              isDisabled={numFilesSelected === 0}
                            >
                              Download files ({numFilesSelected})
                            </MenuItem>
                            {activeTabKey === 'upload-complete' && (
                              <MenuItem
                                itemId="download-original-files"
                                onClick={handleDownloadOriginalFiles}
                                isDisabled={revertableSelection.length === 0}
                              >
                                Download original files ({revertableSelection.length})
                              </MenuItem>
                            )}
                            <MenuItem
                              className='blue-item'
                              itemId="download-all-files"
                              onClick={() => downloadFilesAsZip(activeTabKey === 'conversion-required' ? conversionRequiredResources.map((resource) => resource.file) : uploadCompleteResources.map((resource) => resource.file))}
                            >
                              Download all files ({totalPageFiles})
                            </MenuItem>
                          </DropdownList>
                        </Dropdown>
                      )}
                    </ToolbarItem>
                    <ToolbarItem key="actions-menu">
                      <Dropdown
                        isOpen={fileActionsDropdownOpen}
                        onSelect={() => setFileActionsDropdownOpen(true)}
                        onOpenChange={(isOpen: boolean) => {setFileActionsDropdownOpen(isOpen)}}
                        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                          <MenuToggle variant='secondary' className="file-actions-menu" ref={toggleRef} onClick={() => setFileActionsDropdownOpen(!fileActionsDropdownOpen)} isExpanded={fileActionsDropdownOpen}>
                            Actions
                          </MenuToggle>
                        )}
                        ouiaId="FileActionsDropdown"
                        shouldFocusToggleOnSelect
                      >
                        <DropdownList>
                          {activeTabKey === 'conversion-required' && (
                            <MenuItem
                              itemId="cancel-conversion"
                              onClick={handleCancelConversion}
                              isDisabled={!selectionConverting}
                            >
                              Cancel conversion ({numConvertingFiles})
                            </MenuItem>
                          )}
                          {activeTabKey === 'upload-complete' && (
                            <MenuItem
                              itemId="revert-conversion"
                              onClick={handleRevert}
                              isDisabled={!selectionRevertable}
                            >
                              Revert conversion ({revertableSelection.length})
                            </MenuItem>
                          )}
                          <MenuItem
                            itemId="delete-files"
                            className="danger-item"
                            onClick={handleDeleteFiles}
                            isDisabled={numDeleteableFiles === 0}
                          >
                            Delete files ({numDeleteableFiles})
                          </MenuItem>
                        </DropdownList>
                      </Dropdown>
                    </ToolbarItem>
                    <ToolbarItem key='pagination'>
                      <Pagination
                        isCompact
                        itemCount={activeTabKey === 'conversion-required' ? shownConversionRequiredResources.length : shownUploadCompleteResources.length}
                        page={page}
                        perPage={perPage}
                        onSetPage={onSetPage}
                        onPerPageSelect={onPerPageSelect}
                        perPageOptions={[
                          { title: '5', value: 5 },
                          { title: '10', value: 10 },
                          { title: '15', value: 15 },
                          { title: '20', value: 20 }
                        ]}
                      />
                    </ToolbarItem>
                  </ToolbarContent>
                </FlexItem>
                </Flex>
              </Toolbar>
            </CardTitle>
            <CardBody>
              <Tabs
                activeKey={activeTabKey}
                onSelect={handleTabClick}
                aria-label='Resource type tabs'
                role='region'
              >
                <Tab 
                  className='conversion-required-tab-title'
                  eventKey='conversion-required' 
                  title={
                    <TabTitleText>
                      <Flex>
                        <FlexItem>
                          <Icon >
                            <WarningIcon color="#FFCC17" />
                          </Icon>
                        </FlexItem>
                        <FlexItem>
                          <Content component='p' style={{ fontWeight: 'bold' }}>
                            Conversion required
                          </Content>
                        </FlexItem>
                        <FlexItem>
                          <Badge style={{ transform: 'translateY(-1px)' }} screenReaderText="Conversion Required">{conversionRequiredResources.length}</Badge>
                        </FlexItem>
                      </Flex>
                    </TabTitleText>
                  } 
                  aria-label='Default content - conversion required'
                >
                  <Table>
                    <Tbody>
                    {shownConversionRequiredResources.slice((page - 1) * perPage, Math.min(page * perPage, shownConversionRequiredResources.length)).map((resource, index) => (
                      <Tr key={index} className='conversion-required-row fat-row'>
                        <Td className='spinner-container'>
                          {convertingFileNames.includes(resource.file.name) && (convertingFileNames[0] === resource.file.name ? (
                            <Tooltip
                              content={
                                <div>
                                  Converting for {Math.floor(elapsed / 1000)} sec
                                </div>
                              }
                              entryDelay={0}
                              exitDelay={150}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                <Spinner diameter="18px" aria-label={`Converting ${resource.file.name}`} />
                              </div>
                            </Tooltip>
                          ) : (
                            <Tooltip
                              content={
                                <div>
                                  Item in queue
                                </div>
                              }
                              entryDelay={0}
                              exitDelay={150}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                <Icon size='lg'>
                                  <PendingIcon color='#004D99' />
                                </Icon>
                              </div>
                            </Tooltip>
                          ))}
                        </Td>
                        <Td 
                          select={{
                            rowIndex: index,
                            isSelected: isResourceSelected(resource),
                            onSelect: (_event, isSelecting) => onSelectResource(resource, (page - 1) * perPage + index, isSelecting),
                          }}
                          style={{ paddingLeft: '1.5rem' }}
                        />
                        <Td>{resource.file.name}</Td>
                        <Td>
                          <Flex>
                            <FlexItem>
                              {getfileIcon(resource.file.type)}
                            </FlexItem>
                            <FlexItem>
                              {translateFileType(resource.file.type)}
                            </FlexItem>
                          </Flex>
                        </Td>
                        <Td>{sizeForDisplay(resource.file.size)}</Td>
                        <Td className='conversion-profile-menu-container'>
                          <Dropdown
                            className="no-gap"
                            isOpen={resource.file.name === openProfileDropdown}
                            onSelect={() => {setOpenProfileDropdown(resource.file.name)}}
                            onOpenChange={(isOpen: boolean) => {setOpenProfileDropdown(isOpen ? resource.file.name : null)}}
                            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                              <MenuToggle className="conversion-profile-menu" isDisabled={convertingFileNames.includes(resource.file.name)} ref={toggleRef} onClick={() => onToggleClick(resource.file.name)} isExpanded={resource.file.name === openProfileDropdown}>
                                {resource.conversionProfile}
                              </MenuToggle>
                            )}
                            ouiaId="ConversionProfileDropdown"
                            shouldFocusToggleOnSelect
                          >
                            <DropdownList className="conversion-profile-dropdown">
                              {conversionProfiles.map((profile, idx) => (
                                <DropdownItem
                                  value={idx}
                                  key={idx}
                                  onClick={() => handleProfileSelect(resource, profile)}
                                  isSelected={resource.conversionProfile === profile.alias}
                                >
                                  {profile.alias}
                                </DropdownItem>
                              ))}
                            </DropdownList>
                            <DropdownList>
                              <Divider component="li" key="separator" />
                              <DropdownItem
                                value={conversionProfiles.length}
                                key="create"
                                onClick={() => handleConversionProfilesOpen(true)}
                              >
                                Create conversion profile
                              </DropdownItem>
                              <DropdownItem
                                value={conversionProfiles.length + 1}
                                key="learn-more"
                                onClick={handleLearnMoreClick}
                                className="link-item"
                              >
                                Explore the default profiles
                                <Icon isInline size="sm" style={{ marginLeft: '0.4rem' }}>
                                  <ExternalLinkIcon color="#0066CC"/>
                                </Icon>
                              </DropdownItem>
                            </DropdownList>
                          </Dropdown>
                        </Td>
                        <Td className='row-end-menu-container'>
                          <Dropdown
                            popperProps={{ position: 'right' }}
                            isOpen={resource.file.name === openFileActionsDropdown}
                            onSelect={() => {setOpenFileActionsDropdown(resource.file.name)}}
                            onOpenChange={(isOpen: boolean) => {setOpenFileActionsDropdown(isOpen ? resource.file.name : null)}}
                            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                              <MenuToggle icon={<EllipsisVIcon />} variant="plain" ref={toggleRef} onClick={() => {onActionsToggleClick(resource.file.name)}} isExpanded={resource.file.name === openFileActionsDropdown}/>
                            )}
                            ouiaId="FileActionsDropdown"
                            shouldFocusToggleOnSelect
                          >
                            <DropdownList>
                              <DropdownItem
                                value={0}
                                key="view"
                                onClick={() => {handleFileActionSelect(resource, "view")}}
                                isSelected={false}
                              >
                                View file
                              </DropdownItem>
                              <DropdownItem
                                value={1}
                                key="download"
                                onClick={() => {handleFileActionSelect(resource, "download")}}
                                isSelected={false}
                              >
                                Download file
                              </DropdownItem>
                              {convertingFileNames.includes(resource.file.name) ? (
                                <DropdownItem
                                  value={2}
                                  key="cancel-conversion"
                                  onClick={() => {handleFileActionSelect(resource, "cancel-conversion")}}
                                  isSelected={false}
                                >
                                  Cancel conversion
                                </DropdownItem>
                              ) : (
                                <DropdownItem
                                  value={2}
                                  key="convert"
                                  onClick={() => {handleFileActionSelect(resource, "convert")}}
                                  isSelected={false}
                                >
                                  Convert file
                                </DropdownItem>
                              )}
                              <Divider component="li" key="separator" />
                              <DropdownItem
                                  value={3}
                                  key="delete"
                                  onClick={() => {handleFileActionSelect(resource, "delete")}}
                                  className="danger-item"
                                  isDisabled={convertingFileNames.includes(resource.file.name)}
                                >
                                  Delete file
                                </DropdownItem>
                            </DropdownList>
                          </Dropdown>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
                  {shownConversionRequiredResources.length === 0 && (
                    <Content component='p' style={{ marginLeft: '1.5rem', marginRight: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
                      No conversion required resources found. Please upload files to convert or adjust your search
                    </Content>
                  )}
                </Tab>
                <Tab 
                  className='upload-complete-tab-title'
                  eventKey='upload-complete' 
                  title={
                    <TabTitleText>
                      <Flex>
                        <FlexItem>
                          <Icon >
                            <CheckCircleIcon color="#3D7317" />
                          </Icon>
                        </FlexItem>
                        <FlexItem>
                          <Content component='p' style={{ fontWeight: 'bold' }}>
                            Upload complete
                          </Content>
                        </FlexItem>
                        <FlexItem>
                          <Badge style={{ transform: 'translateY(-1px)' }} screenReaderText="Upload complete">{uploadCompleteResources.length}</Badge>
                        </FlexItem>
                      </Flex>
                    </TabTitleText>
                  } 
                  aria-label='Upload complete'
                >
                  <Table>
                  <Tbody key='upload-complete'>
                  {shownUploadCompleteResources.slice((page - 1) * perPage, Math.min(page * perPage, shownUploadCompleteResources.length)).map((resource, index) => (
                    <Tr key={index} className="upload-complete-row fat-row">
                      <Td/>
                      <Td 
                        style={{ paddingLeft: '1.5rem' }}
                        select={{
                          rowIndex: shownConversionRequiredResources.length + index,
                          isSelected: isResourceSelected(resource),
                          onSelect: (_event, isSelecting) => onSelectResource(resource, shownConversionRequiredResources.length + (page - 1) * perPage + index, isSelecting),
                        }}
                      />
                      <Td>{resource.file.name}</Td>
                      <Td>
                        <Flex>
                          <FlexItem>
                            {getfileIcon(resource.file.type)}
                          </FlexItem>
                          <FlexItem>
                            {translateFileType(resource.file.type)}
                          </FlexItem>
                        </Flex>
                      </Td>
                      <Td>{sizeForDisplay(resource.file.size)}</Td>
                      <Td>
                        {resource.datetimeConverted ? (
                          <>
                            Converted
                            <Tooltip
                              className={showConversionProfiles ? 'reduce-z' : ''}
                              content={
                                <div>
                                  Converted with the "
                                    {conversionProfiles.map((profile) => profile.alias).includes(resource.conversionProfile) ? (
                                      <Content className='tooltip-text' component='a' onClick={() => inspectProfile(resource.conversionProfile)}>{resource.conversionProfile}</Content>
                                    ) : (
                                      `${resource.conversionProfile}`
                                    )}
                                  " profile
                                </div>
                              }
                              entryDelay={0}
                              exitDelay={150}
                            >
                                <Icon size='md' style= {{ marginLeft: '0.75rem'}}>
                                  <QuestionMarkIcon/>
                                </Icon>
                            </Tooltip>
                          </>
                        ) : (
                          <>
                            Uploaded
                          </>
                        )}
                      </Td>
                      <Td>{resource.datetimeConverted ? formatDate(resource.datetimeConverted): formatDate(resource.datetimeUploaded)}</Td>
                      <Td className='row-end-menu-container'>
                        <Dropdown
                          popperProps={{ position: 'right' }}
                          isOpen={resource.file.name === openFileActionsDropdown}
                          onSelect={() => {setOpenFileActionsDropdown(resource.file.name)}}
                          onOpenChange={(isOpen: boolean) => {setOpenFileActionsDropdown(isOpen ? resource.file.name : null)}}
                          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                            <MenuToggle icon={<EllipsisVIcon />} variant="plain" ref={toggleRef} onClick={() => {onActionsToggleClick(resource.file.name)}} isExpanded={resource.file.name === openFileActionsDropdown}/>
                          )}
                          ouiaId="FileActionsDropdown"
                          shouldFocusToggleOnSelect
                        >
                          <DropdownList>
                            <DropdownItem
                              value={0}
                              key="view"
                              onClick={() => {handleFileActionSelect(resource, "view")}}
                              isSelected={false}
                            >
                              View file
                            </DropdownItem>
                            <DropdownItem
                              value={1}
                              key="download"
                              onClick={() => {handleFileActionSelect(resource, "download")}}
                              isSelected={false}
                            >
                              Download file
                            </DropdownItem>
                            {resource.originalFile != null && (
                              <>
                                <DropdownItem
                                  value={2}
                                  key="view-original"
                                  onClick={() => {handleFileActionSelect(resource, "view-original")}}
                                  isSelected={false}
                                >
                                  View original file
                                </DropdownItem>
                                <DropdownItem
                                  value={3}
                                  key="download-original"
                                  onClick={() => {handleFileActionSelect(resource, "download-original")}}
                                  isSelected={false}
                                  isDisabled={resource.originalFile == null}
                                >
                                  Download original file
                                </DropdownItem>
                                <DropdownItem
                                  value={4}
                                  key="revert-conversion"
                                  onClick={() => {handleFileActionSelect(resource, "revert")}}
                                  isSelected={false}
                                  isDisabled={resource.originalFile == null}
                                >
                                  Revert conversion
                                </DropdownItem>
                              </>
                            )}
                            <Divider component="li" key="separator" />
                            <DropdownItem
                                value={5}
                                key="delete"
                                onClick={() => {handleFileActionSelect(resource, "delete")}}
                                className="danger-item"
                              >
                                Delete file
                              </DropdownItem>
                          </DropdownList>
                        </Dropdown>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
                    {shownUploadCompleteResources.length === 0 && (
                      <Content component='p' style={{ marginLeft: '1.5rem', marginRight: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
                        No upload complete resources found. Please upload files in markdown format, convert files in the conversion required tab, or adjust your search
                      </Content>
                    )}
                </Tab>
              </Tabs>
            </CardBody>
          </Card>
        </FlexItem>
      </Flex>

      <Modal
        isOpen={showConversionProfiles}
        onClose={handleConversionProfilesClose}
        disableFocusTrap
        aria-label="manage conversion profiles"
        aria-labelledby="manage-conversion-profiles-title"
        aria-describedby="manage-conversion-profiles-variant"
        style={{ maxWidth: "min(1600px, 97.5%)" }}
      >
        <ModalHeader
          title="Manage conversion profiles"
          labelId="manage-conversion-profiles-title"
        />
        <ModalBody id="manage-conversion-profiles-variant">
          <Content component="p">
            Select profiles in the left menu to view and edit their settings. Create new profiles to add a new group of settings.{" "}
              <Content component="a" href="https://github.com/fabianofranz/docling-conversion-tutorials/tree/main" target="_blank" rel="noopener noreferrer">
                Learn more about the default conversion profiles 
                <Icon isInline size="sm" style={{ marginLeft: '0.25rem', marginRight: '0.4rem' }}>
                  <ExternalLinkIcon color="#0066CC"/>
                </Icon>
              </Content>
          </Content>
          <Flex style={{ marginTop: '2rem' }} columnGap={{ default: 'columnGapLg' }}>
            <FlexItem>
              <Menu className="inset-menu" activeItemId={viewedProfile.alias} onSelect={onProfileSelect} isScrollable>
                <MenuContent>
                  <Flex className="conversion-profiles-header" justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                    <FlexItem>
                      <Content component='p'>Conversion Profiles</Content>
                    </FlexItem>
                    <FlexItem>
                      <Button icon={<PlusIcon className={`${initialViewedProfile.alias === "" && 'green-icon'}`}/>} variant="plain" isClicked={initialViewedProfile.alias === ""} onClick={handleCreateClick}  className="create-profile-button" />
                    </FlexItem>
                  </Flex>
                </MenuContent>
                <MenuContent maxMenuHeight="494px">
                  <MenuList>
                    {conversionProfiles.map((profile, index) => (
                      <MenuItem key={index} itemId={profile.alias} isFocused={profile.alias === initialViewedProfile.alias}>
                        {profile.alias}
                      </MenuItem>
                    ))}
                  </MenuList>
                </MenuContent>
              </Menu>
            </FlexItem>
            <FlexItem flex={{ default: 'flex_1' }} className={`settings-view-container ${initialViewedProfile.alias === "" ? "green-border" : hasChanged ? "blue-border" : ""}`} ref={settingsViewContainerRef}>
              <Content style={{ fontSize: '0.8rem'}} component="p">
                Want to learn more about these options? Reference{" "}
                <Content style={{ fontSize: '0.8rem' }} component="a" href="https://github.com/docling-project/docling-serve/blob/main/docs/usage.md" target="_blank" rel="noopener noreferrer">
                  Docling's documentation for each parameter
                  <Icon isInline size="sm" style={{ marginLeft: '0.25rem', marginRight: '0.4rem' }}>
                    <ExternalLinkIcon color="#0066CC"/>
                  </Icon>
                </Content>
              </Content>
              <Flex columnGap={{ default: 'columnGap2xl' }}>
                <FlexItem flex={{ default: 'flex_1' }}>
                  <Flex direction={{ default: 'column' }}>
                    <FlexItem>
                      <Content component="p">Alias:</Content>
                    </FlexItem>
                    <FlexItem>
                      <TextInput
                          aria-label='alias-input'
                          value={viewedProfile.alias}
                          type="text"
                          onChange={(_event, value) => {handleViewedProfileChange(value, "alias")}}
                          isDisabled={!viewedProfile.editable}
                          placeholder='Enter alias...'
                        />
                    </FlexItem>
                    {viewedProfile.editable && (
                      <FlexItem>
                        {aliasErrors.length > 0 ? (
                          <Content style={{ fontSize: '0.7rem', color: '#B1380B'}} component="p">
                            {aliasErrors[0]}
                          </Content>
                        ) : (
                          <Content style={{ fontSize: '0.7rem' }} component="p">
                            {viewedProfile.alias.length}/{maxAliasCharacters} characters
                          </Content>
                        )}
                      </FlexItem>
                    )}
                    <FlexItem>
                      <Content component="p" className="new-option">Image Export Mode:</Content>
                    </FlexItem>
                    <FlexItem>
                      <Dropdown
                          isOpen={openEditConversionProfileDropdown === "image_export_mode"}
                          onSelect={() => {setOpenEditConversionProfileDropdown("image_export_mode")}}
                          onOpenChange={(isOpen: boolean) => {setOpenEditConversionProfileDropdown(isOpen ? "image_export_mode" : null)}}
                          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                            <MenuToggle className="manage-conversion-profiles-dropdown" isDisabled={!viewedProfile.editable} ref={toggleRef} onClick={() => {setOpenEditConversionProfileDropdown(openEditConversionProfileDropdown === "image_export_mode" ? null : "image_export_mode")}} isExpanded={openEditConversionProfileDropdown === "image_export_mode"}>
                              {viewedProfileDisplay.image_export_mode}
                            </MenuToggle>
                          )}
                          ouiaId="ImageExportModeDropdown"
                          shouldFocusToggleOnSelect
                        >
                          <DropdownList>
                            {imageExportModeOptions.map((option, idx) => {
                              return (
                                <DropdownItem
                                  value={idx}
                                  key={option.value}
                                  onClick={() => {handleViewedProfileChange(option.value, "image_export_mode")}}
                                  isSelected={viewedProfile.image_export_mode === option.value}
                                >
                                  {option.display}
                                </DropdownItem>
                              )
                            })}
                          </DropdownList>
                        </Dropdown>
                    </FlexItem>
                    <FlexItem>
                      <Content component="p" className="new-option">OCR Engine:</Content>
                    </FlexItem>
                    <FlexItem>
                      <Dropdown
                          isOpen={openEditConversionProfileDropdown === "ocr_engine"}
                          onSelect={() => {setOpenEditConversionProfileDropdown("ocr_engine")}}
                          onOpenChange={(isOpen: boolean) => {setOpenEditConversionProfileDropdown(isOpen ? "ocr_engine" : null)}}
                          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                            <MenuToggle className="manage-conversion-profiles-dropdown" isDisabled={!viewedProfile.editable} ref={toggleRef} onClick={() => {setOpenEditConversionProfileDropdown(openEditConversionProfileDropdown === "ocr_engine" ? null : "ocr_engine")}} isExpanded={openEditConversionProfileDropdown === "ocr_engine"}>
                              {viewedProfileDisplay.ocr_engine}
                            </MenuToggle>
                          )}
                          ouiaId="OCREngineDropdown"
                          shouldFocusToggleOnSelect
                        >
                          <DropdownList>
                            {ocrEngineOptions.map((option, idx) => {
                              return (
                                <DropdownItem
                                  value={idx}
                                  key={option.value}
                                  onClick={() => {handleViewedProfileChange(option.value, "ocr_engine")}}
                                  isSelected={viewedProfile.ocr_engine === option.value}
                                >
                                  {option.display}
                                </DropdownItem>
                              )
                            })}
                          </DropdownList>
                        </Dropdown>
                    </FlexItem>
                    <FlexItem>
                      <Content component="p" className="new-option">PDF Backend:</Content>
                    </FlexItem>
                    <FlexItem>
                      <Dropdown
                          isOpen={openEditConversionProfileDropdown === "pdf_backend"}
                          onSelect={() => {setOpenEditConversionProfileDropdown("pdf_backend")}}
                          onOpenChange={(isOpen: boolean) => {setOpenEditConversionProfileDropdown(isOpen ? "pdf_backend" : null)}}
                          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                            <MenuToggle className="manage-conversion-profiles-dropdown" isDisabled={!viewedProfile.editable} ref={toggleRef} onClick={() => {setOpenEditConversionProfileDropdown(openEditConversionProfileDropdown === "pdf_backend" ? null : "pdf_backend")}} isExpanded={openEditConversionProfileDropdown === "pdf_backend"}>
                              {viewedProfileDisplay.pdf_backend}
                            </MenuToggle>
                          )}
                          ouiaId="PDFBackendDropdown"
                          shouldFocusToggleOnSelect
                        >
                          <DropdownList>
                            {pdfBackendOptions.map((option, idx) => {
                              return (
                                <DropdownItem
                                  value={idx}
                                  key={option.value}
                                  onClick={() => {handleViewedProfileChange(option.value, "pdf_backend")}}
                                  isSelected={viewedProfile.pdf_backend === option.value}
                                >
                                  {option.display}
                                </DropdownItem>
                              )
                            })}
                          </DropdownList>
                        </Dropdown>
                    </FlexItem>
                    <FlexItem>
                      <Content component="p" className="new-option">Table Mode:</Content>
                    </FlexItem>
                    <FlexItem>
                      <Dropdown
                          isOpen={openEditConversionProfileDropdown === "table_mode"}
                          onSelect={() => {setOpenEditConversionProfileDropdown("table_mode")}}
                          onOpenChange={(isOpen: boolean) => {setOpenEditConversionProfileDropdown(isOpen ? "table_mode" : null)}}
                          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                            <MenuToggle className="manage-conversion-profiles-dropdown" isDisabled={!viewedProfile.editable} ref={toggleRef} onClick={() => {setOpenEditConversionProfileDropdown(openEditConversionProfileDropdown === "table_mode" ? null : "table_mode")}} isExpanded={openEditConversionProfileDropdown === "table_mode"}>
                              {viewedProfileDisplay.table_mode}
                            </MenuToggle>
                          )}
                          ouiaId="TableModeDropdown"
                          shouldFocusToggleOnSelect
                        >
                          <DropdownList>
                            {tableModeOptions.map((option, idx) => {
                              return (
                                <DropdownItem
                                  value={idx}
                                  key={option.value}
                                  onClick={() => {handleViewedProfileChange(option.value, "table_mode")}}
                                  isSelected={viewedProfile.table_mode === option.value}
                                >
                                  {option.display}
                                </DropdownItem>
                              )
                            })}
                          </DropdownList>
                        </Dropdown>
                    </FlexItem>
                  </Flex>
                </FlexItem>
                <FlexItem flex={{ default: 'flex_1' }}>
                  <Flex direction={{ default: 'column' }}>
                    <FlexItem>
                      <Content component="p" className="new-option">Pipeline Type:</Content>
                    </FlexItem>
                    <FlexItem>
                      <Dropdown
                        isOpen={openEditConversionProfileDropdown === "pipeline"}
                        onSelect={() => {setOpenEditConversionProfileDropdown("pipeline")}}
                        onOpenChange={(isOpen: boolean) => {setOpenEditConversionProfileDropdown(isOpen ? "pipeline" : null)}}
                        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                          <MenuToggle className="manage-conversion-profiles-dropdown" isDisabled={!viewedProfile.editable} ref={toggleRef} onClick={() => {setOpenEditConversionProfileDropdown(openEditConversionProfileDropdown === "pipeline" ? null : "pipeline")}} isExpanded={openEditConversionProfileDropdown === "pipeline"}>
                            {viewedProfileDisplay.pipeline}
                          </MenuToggle>
                        )}
                        ouiaId="PipelineDropdown"
                        shouldFocusToggleOnSelect
                      >
                        <DropdownList>
                          {pipelineOptions.map((option, idx) => {
                            return (
                              <DropdownItem
                                value={idx}
                                key={option.value}
                                onClick={() => {handleViewedProfileChange(option.value, "pipeline")}}
                                isSelected={viewedProfile.pipeline === option.value}
                              >
                                {option.display}
                              </DropdownItem>
                            )
                          })}
                        </DropdownList>
                      </Dropdown>
                    </FlexItem>
                    <FlexItem style={{ marginTop: '1.5rem'}}>
                      <Flex direction={{ default: 'column' }} style={{ justifyItems: 'center'}}>
                        <FlexItem>
                          <Checkbox
                            label="Allow optical character recognition (OCR)"
                            isChecked={viewedProfile.do_ocr}
                            onChange={(_event, checked) => {handleViewedProfileChange(checked, "do_ocr")}}
                            id="do-ocr-checkbox"
                            isDisabled={!viewedProfile.editable}
                          />
                        </FlexItem>
                        <FlexItem>
                          <Checkbox
                            label="Force optical character recognition (OCR)"
                            isChecked={viewedProfile.force_ocr}
                            onChange={(_event, checked) => {handleViewedProfileChange(checked, "force_ocr")}}
                            id="force-ocr-checkbox"
                            isDisabled={!viewedProfile.editable}
                          />
                        </FlexItem>
                        <FlexItem>
                          <Checkbox
                            label="Code enrichment"
                            isChecked={viewedProfile.do_code_enrichment}
                            onChange={(_event, checked) => {handleViewedProfileChange(checked, "do_code_enrichment")}}
                            id="do-code-enrichment-checkbox"
                            isDisabled={!viewedProfile.editable}
                          />
                        </FlexItem>
                        <FlexItem>
                          <Checkbox
                            label="Formula enrichment"
                            isChecked={viewedProfile.do_formula_enrichment}
                            onChange={(_event, checked) => {handleViewedProfileChange(checked, "do_formula_enrichment")}}
                            id="do-formula-enrichment-checkbox"
                            isDisabled={!viewedProfile.editable}
                          />
                        </FlexItem>
                        <FlexItem>
                          <Checkbox
                            label="Picture classification"
                            isChecked={viewedProfile.do_picture_classification}
                            onChange={(_event, checked) => {handleViewedProfileChange(checked, "do_picture_classification")}}
                            id="do-picture-classification-checkbox"
                            isDisabled={!viewedProfile.editable}
                          />
                        </FlexItem>
                        <FlexItem>
                          <Checkbox
                            label="Picture description"
                            isChecked={viewedProfile.do_picture_description}
                            onChange={(_event, checked) => {handleViewedProfileChange(checked, "do_picture_description")}}
                            id="do-picture-description-checkbox"
                            isDisabled={!viewedProfile.editable}
                          />
                        </FlexItem>
                        <FlexItem>
                          <Checkbox
                            label="Do tables"
                            isChecked={viewedProfile.do_table_structure}
                            onChange={(_event, checked) => {handleViewedProfileChange(checked, "do_table_structure")}}
                            id="do-table-structure-checkbox"
                            isDisabled={!viewedProfile.editable}
                          />
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  </Flex>
                </FlexItem>
              </Flex>
              <Flex direction={{ default: 'column' }} style={{ marginTop: '1rem' }}>
                <FlexItem>
                  <Content component="p" className="new-option">Page Break Placeholder:</Content>
                </FlexItem>
                <FlexItem>
                  <TextArea
                    value={viewedProfile.md_page_break_placeholder}
                    onChange={(_event, value) => {handleViewedProfileChange(value, "md_page_break_placeholder")}}
                    resizeOrientation="none"
                    aria-label="placeholder-text-area"
                    placeholder="None"
                    isDisabled={!viewedProfile.editable}
                  />
                </FlexItem>
                {viewedProfile.editable && (
                  <FlexItem>
                    {placeholderErrors.length > 0 ? (
                      <Content style={{ fontSize: '0.7rem', color: '#B1380B'}} component="p">
                        {placeholderErrors[0]}
                      </Content>
                    ) : (
                      <Content style={{ fontSize: '0.7rem' }} component="p">
                        {viewedProfile.md_page_break_placeholder.length}/{maxPlaceholderCharacters} characters
                      </Content>
                    )}
                  </FlexItem>
                )}
              </Flex>
            </FlexItem>
          </Flex>
        </ModalBody>
        <ModalFooter className='conversion-profiles-footer'>
          <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}  style={{ width: '100%' }}>
            {initialViewedProfile.alias === "" ? (
                <>
                  <FlexItem>
                    <Button variant={`${isDangerous ? 'danger' : 'secondary'}`} onClick={handleConversionProfilesClose}>
                      Exit
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Flex>
                      <FlexItem>
                        <Button variant="secondary" isDisabled={!hasChanged} onClick={handleResetChanges}>
                          Reset to Default
                        </Button>
                      </FlexItem>
                      <FlexItem>
                        <Button isDisabled={hasErrors} onClick={handleCreateProfile}>
                          Create
                        </Button>
                      </FlexItem>
                    </Flex>
                  </FlexItem>
                </>
            ) : (
              <>
                <FlexItem>
                  <Button variant={`${isDangerous ? 'danger' : 'secondary'}`} onClick={handleConversionProfilesClose}>
                    Exit
                  </Button>
                </FlexItem>
                <FlexItem>
                  <Flex>
                    <FlexItem>
                      <Button variant="danger" isDisabled={!viewedProfile.editable} onClick={handleDeleteProfile}>
                        Delete Profile
                      </Button>
                    </FlexItem>
                    <FlexItem>
                      <Button variant="secondary" isDisabled={!hasChanged} onClick={handleResetChanges}>
                        Reset Changes
                      </Button>
                    </FlexItem>
                    <FlexItem>
                      <Button isDisabled={!hasChanged || hasErrors} onClick={handleSaveProfile}>
                        Save Changes
                      </Button>
                    </FlexItem>
                  </Flex>
                </FlexItem>
              </>
            )}
          </Flex>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={showSaveWarning}
        disableFocusTrap
        variant="small"
        aria-label="unsaved changes warning"
        aria-labelledby="unsaved-changes-warning-title"
        aria-describedby="unsaved-changes-warning-variant"
      >
        <ModalHeader title="Unsaved Changes" labelId="unsaved-changes-warning-title" titleIconVariant="warning" />
        <ModalBody id="unsaved-changes-warning-variant">
          <Content component='p'>Are you sure you want to {showSaveVariant == 'exit' ? 'exit': 'switch profiles'}? Changes have been made to this profile that will not be saved</Content>
        </ModalBody>
        <ModalFooter>
          <Flex>
            <FlexItem>
              <Button key="discard" variant="danger" onClick={handleDiscardChanges}>
                Discard changes
              </Button>
            </FlexItem>

            <FlexItem>
              <Button key="cancel" variant="secondary" onClick={handleDismissWarning}>
                Cancel
              </Button>
            </FlexItem>
          </Flex>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={conversionErrorMessage !== null}
        disableFocusTrap
        variant="small"
      >
        <ModalHeader title="🤕 Uh oh..."/>
        <ModalBody>
          <Content component='p'>
            There was an error during the conversion process, likely due to docling-serve disconnecting. Please click "Continue" to reconfirm the configuration
          </Content>
          <ExpandableSection
            toggleText={errorShown ? 'Hide full error message' : 'Show full error message'}
            onToggle={() => setErrorShown(!errorShown)}
            isExpanded={errorShown}
          >
            {conversionErrorMessage}
          </ExpandableSection>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="primary"
            onClick={() => {
              setConversionErrorMessage(null);
              returnPort("");
            }}
          >
            Continue
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setConversionErrorMessage(null);
            }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={showDeleteProfileWarning}
        disableFocusTrap
        variant="small"
      >
        <ModalHeader title="Delete Profile?"/>
        <ModalBody>
          <Content component='p'>
            Are you sure that you want to delete this conversion profile? This action cannot be undone.
          </Content>
        </ModalBody>
        <ModalFooter>
          <Flex>
            <FlexItem>
              <Button key="delete" variant="danger" onClick={handleConfirmDeleteProfile}>
                Delete
              </Button>
            </FlexItem>

            <FlexItem>
              <Button key="cancel" variant="secondary" onClick={handleDismissDeleteProfileWarning}>
                Cancel
              </Button>
            </FlexItem>
          </Flex>
        </ModalFooter>
      </Modal>
    </>
  );
}

export default ConversionStep;