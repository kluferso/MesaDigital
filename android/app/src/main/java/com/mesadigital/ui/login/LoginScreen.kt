package com.mesadigital.ui.login

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.mesadigital.R
import com.mesadigital.ui.theme.Blue500
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(
    onNavigateToRoom: (String, String, String) -> Unit
) {
    val focusManager = LocalFocusManager.current
    val scaffoldState = rememberScaffoldState()
    val coroutineScope = rememberCoroutineScope()
    val scrollState = rememberScrollState()
    
    // Estados
    var userName by remember { mutableStateOf("") }
    var roomId by remember { mutableStateOf("") }
    var isCreatingRoom by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var selectedInstrument by remember { mutableStateOf(stringResource(R.string.instrument_vocal)) }
    var showInstrumentDialog by remember { mutableStateOf(false) }
    
    Scaffold(
        scaffoldState = scaffoldState,
        backgroundColor = MaterialTheme.colors.background
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(scrollState)
                    .padding(horizontal = 24.dp, vertical = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Logo ou título
                Text(
                    text = stringResource(R.string.login_title),
                    style = MaterialTheme.typography.h4,
                    fontWeight = FontWeight.Bold,
                    color = Blue500,
                    textAlign = TextAlign.Center
                )
                
                Spacer(modifier = Modifier.height(12.dp))
                
                Text(
                    text = stringResource(R.string.login_subtitle),
                    style = MaterialTheme.typography.subtitle1,
                    color = MaterialTheme.colors.onBackground.copy(alpha = 0.7f),
                    textAlign = TextAlign.Center
                )
                
                Spacer(modifier = Modifier.height(32.dp))
                
                // Campo de nome
                OutlinedTextField(
                    value = userName,
                    onValueChange = { userName = it },
                    label = { Text(stringResource(R.string.name_hint)) },
                    modifier = Modifier.fillMaxWidth(),
                    leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions.Default.copy(
                        imeAction = ImeAction.Next
                    ),
                    keyboardActions = KeyboardActions(
                        onNext = {
                            focusManager.moveFocus(FocusDirection.Down)
                        }
                    )
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Campo de ID da sala
                OutlinedTextField(
                    value = roomId,
                    onValueChange = { roomId = it },
                    label = { Text(stringResource(R.string.room_id_hint)) },
                    modifier = Modifier.fillMaxWidth(),
                    leadingIcon = { Icon(Icons.Default.MeetingRoom, contentDescription = null) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions.Default.copy(
                        imeAction = ImeAction.Done
                    ),
                    keyboardActions = KeyboardActions(
                        onDone = {
                            focusManager.clearFocus()
                        }
                    )
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                
                // Seleção de instrumento
                Button(
                    onClick = { showInstrumentDialog = true },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        backgroundColor = MaterialTheme.colors.surface,
                        contentColor = MaterialTheme.colors.onSurface
                    ),
                    elevation = ButtonDefaults.elevation(
                        defaultElevation = 0.dp,
                        pressedElevation = 0.dp
                    ),
                    contentPadding = PaddingValues(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Start
                    ) {
                        // Ícone do instrumento
                        val instrumentIcon = when (selectedInstrument) {
                            stringResource(R.string.instrument_vocal) -> Icons.Default.Mic
                            stringResource(R.string.instrument_guitar) -> Icons.Default.MusicNote
                            stringResource(R.string.instrument_bass) -> Icons.Default.MusicNote
                            stringResource(R.string.instrument_drums) -> Icons.Default.Album
                            stringResource(R.string.instrument_keyboard) -> Icons.Default.Piano
                            else -> Icons.Default.MusicNote
                        }
                        
                        Icon(
                            imageVector = instrumentIcon,
                            contentDescription = null,
                            tint = MaterialTheme.colors.primary,
                            modifier = Modifier.size(24.dp)
                        )
                        
                        Spacer(modifier = Modifier.width(16.dp))
                        
                        Column(
                            modifier = Modifier.weight(1f),
                            horizontalAlignment = Alignment.Start
                        ) {
                            Text(
                                text = stringResource(R.string.select_instrument),
                                style = MaterialTheme.typography.caption,
                                color = MaterialTheme.colors.onSurface.copy(alpha = 0.7f)
                            )
                            
                            Text(
                                text = selectedInstrument,
                                style = MaterialTheme.typography.subtitle1,
                                fontWeight = FontWeight.Medium
                            )
                        }
                        
                        Icon(
                            imageVector = Icons.Default.KeyboardArrowDown,
                            contentDescription = null,
                            tint = MaterialTheme.colors.onSurface.copy(alpha = 0.7f)
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(32.dp))
                
                // Botões de ação
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Botão Criar Sala
                    Button(
                        onClick = {
                            isCreatingRoom = true
                            handleRoomAction(
                                userName = userName,
                                roomId = roomId,
                                instrument = selectedInstrument,
                                isCreatingRoom = true,
                                onError = { message ->
                                    coroutineScope.launch {
                                        scaffoldState.snackbarHostState.showSnackbar(message)
                                    }
                                },
                                onNavigateToRoom = onNavigateToRoom
                            )
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(
                            backgroundColor = MaterialTheme.colors.primary
                        ),
                        enabled = !isLoading
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(Icons.Default.AddCircle, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(stringResource(R.string.create_room))
                        }
                    }
                    
                    // Botão Entrar na Sala
                    Button(
                        onClick = {
                            isCreatingRoom = false
                            handleRoomAction(
                                userName = userName,
                                roomId = roomId,
                                instrument = selectedInstrument,
                                isCreatingRoom = false,
                                onError = { message ->
                                    coroutineScope.launch {
                                        scaffoldState.snackbarHostState.showSnackbar(message)
                                    }
                                },
                                onNavigateToRoom = onNavigateToRoom
                            )
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(
                            backgroundColor = MaterialTheme.colors.primaryVariant
                        ),
                        enabled = !isLoading
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(Icons.Default.Login, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(stringResource(R.string.join_room))
                        }
                    }
                }
                
                if (isLoading) {
                    Spacer(modifier = Modifier.height(24.dp))
                    CircularProgressIndicator()
                }
            }
            
            // Diálogo de seleção de instrumento
            if (showInstrumentDialog) {
                AlertDialog(
                    onDismissRequest = { showInstrumentDialog = false },
                    title = { Text(stringResource(R.string.select_instrument)) },
                    text = {
                        Column {
                            InstrumentOption(
                                name = stringResource(R.string.instrument_vocal),
                                icon = Icons.Default.Mic,
                                isSelected = selectedInstrument == stringResource(R.string.instrument_vocal),
                                onSelect = {
                                    selectedInstrument = stringResource(R.string.instrument_vocal)
                                    showInstrumentDialog = false
                                }
                            )
                            
                            InstrumentOption(
                                name = stringResource(R.string.instrument_guitar),
                                icon = Icons.Default.MusicNote,
                                isSelected = selectedInstrument == stringResource(R.string.instrument_guitar),
                                onSelect = {
                                    selectedInstrument = stringResource(R.string.instrument_guitar)
                                    showInstrumentDialog = false
                                }
                            )
                            
                            InstrumentOption(
                                name = stringResource(R.string.instrument_bass),
                                icon = Icons.Default.MusicNote,
                                isSelected = selectedInstrument == stringResource(R.string.instrument_bass),
                                onSelect = {
                                    selectedInstrument = stringResource(R.string.instrument_bass)
                                    showInstrumentDialog = false
                                }
                            )
                            
                            InstrumentOption(
                                name = stringResource(R.string.instrument_drums),
                                icon = Icons.Default.Album,
                                isSelected = selectedInstrument == stringResource(R.string.instrument_drums),
                                onSelect = {
                                    selectedInstrument = stringResource(R.string.instrument_drums)
                                    showInstrumentDialog = false
                                }
                            )
                            
                            InstrumentOption(
                                name = stringResource(R.string.instrument_keyboard),
                                icon = Icons.Default.Piano,
                                isSelected = selectedInstrument == stringResource(R.string.instrument_keyboard),
                                onSelect = {
                                    selectedInstrument = stringResource(R.string.instrument_keyboard)
                                    showInstrumentDialog = false
                                }
                            )
                            
                            InstrumentOption(
                                name = stringResource(R.string.instrument_other),
                                icon = Icons.Default.MusicNote,
                                isSelected = selectedInstrument == stringResource(R.string.instrument_other),
                                onSelect = {
                                    selectedInstrument = stringResource(R.string.instrument_other)
                                    showInstrumentDialog = false
                                }
                            )
                        }
                    },
                    confirmButton = {
                        TextButton(onClick = { showInstrumentDialog = false }) {
                            Text(stringResource(R.string.cancel))
                        }
                    }
                )
            }
        }
    }
}

@Composable
fun InstrumentOption(
    name: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    isSelected: Boolean,
    onSelect: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
            .clickable { onSelect() },
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = name,
            tint = if (isSelected) MaterialTheme.colors.primary else MaterialTheme.colors.onSurface,
            modifier = Modifier.size(24.dp)
        )
        
        Spacer(modifier = Modifier.width(16.dp))
        
        Text(
            text = name,
            style = MaterialTheme.typography.subtitle1,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
            color = if (isSelected) MaterialTheme.colors.primary else MaterialTheme.colors.onSurface
        )
        
        Spacer(modifier = Modifier.weight(1f))
        
        if (isSelected) {
            Icon(
                imageVector = Icons.Default.Check,
                contentDescription = null,
                tint = MaterialTheme.colors.primary
            )
        }
    }
}

/**
 * Lida com a ação de criar ou entrar em uma sala
 */
private fun handleRoomAction(
    userName: String,
    roomId: String,
    instrument: String,
    isCreatingRoom: Boolean,
    onError: (String) -> Unit,
    onNavigateToRoom: (String, String, String) -> Unit
) {
    // Validação
    if (userName.isBlank()) {
        onError(R.string.error_empty_name.toString())
        return
    }
    
    if (roomId.isBlank()) {
        onError(R.string.error_empty_room.toString())
        return
    }
    
    // Na aplicação real, aqui seria feita uma chamada ao servidor
    // para criar ou entrar na sala
    
    // Para esse exemplo, apenas navegamos para a sala
    val finalRoomId = if (isCreatingRoom) {
        // Simular criação de sala (em um app real, o servidor geraria o ID)
        roomId
    } else {
        roomId
    }
    
    // Navegar para a sala com o nome de usuário e instrumento
    onNavigateToRoom(finalRoomId, userName, instrument)
}
