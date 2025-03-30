package com.mesadigital.ui.login

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddCircle
import androidx.compose.material.icons.filled.Login
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Room
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mesadigital.R
import com.mesadigital.ui.theme.Blue500
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(
    onNavigateToRoom: (String, String) -> Unit
) {
    val focusManager = LocalFocusManager.current
    val scaffoldState = rememberScaffoldState()
    val coroutineScope = rememberCoroutineScope()
    
    // Estados
    var userName by remember { mutableStateOf("") }
    var roomId by remember { mutableStateOf("") }
    var isCreatingRoom by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    
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
                    .padding(horizontal = 24.dp),
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
                    leadingIcon = { Icon(Icons.Default.Room, contentDescription = null) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions.Default.copy(
                        imeAction = ImeAction.Done
                    ),
                    keyboardActions = KeyboardActions(
                        onDone = {
                            focusManager.clearFocus()
                            handleRoomAction(
                                userName = userName,
                                roomId = roomId,
                                isCreatingRoom = isCreatingRoom,
                                onError = { message ->
                                    coroutineScope.launch {
                                        scaffoldState.snackbarHostState.showSnackbar(message)
                                    }
                                },
                                onNavigateToRoom = onNavigateToRoom
                            )
                        }
                    )
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                
                // Instrumento fixo (apenas Vocal)
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    elevation = 0.dp,
                    backgroundColor = MaterialTheme.colors.surface,
                    shape = RoundedCornerShape(8.dp),
                    border = ButtonDefaults.outlinedBorder
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            tint = MaterialTheme.colors.primary
                        )
                        Spacer(modifier = Modifier.width(16.dp))
                        Column {
                            Text(
                                text = "Instrumento",
                                style = MaterialTheme.typography.caption,
                                color = MaterialTheme.colors.onSurface.copy(alpha = 0.7f)
                            )
                            Text(
                                text = stringResource(R.string.instrument_vocal),
                                style = MaterialTheme.typography.subtitle1,
                                fontWeight = FontWeight.Medium
                            )
                        }
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
                            backgroundColor = MaterialTheme.colors.secondary
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
                
                // Indicador de carregamento
                if (isLoading) {
                    Spacer(modifier = Modifier.height(24.dp))
                    CircularProgressIndicator()
                }
            }
        }
    }
}

/**
 * Lida com a ação de criar ou entrar em uma sala
 */
private fun handleRoomAction(
    userName: String,
    roomId: String,
    isCreatingRoom: Boolean,
    onError: (String) -> Unit,
    onNavigateToRoom: (String, String) -> Unit
) {
    // Validação de entrada
    if (userName.isBlank()) {
        onError("Por favor, informe seu nome")
        return
    }
    
    if (roomId.isBlank() && !isCreatingRoom) {
        onError("Por favor, informe o ID da sala")
        return
    }
    
    // Para criar sala, gera um ID aleatório se não foi informado
    val finalRoomId = if (isCreatingRoom && roomId.isBlank()) {
        // Gerar ID aleatório de 6 caracteres
        val allowedChars = ('A'..'Z') + ('0'..'9')
        (1..6).map { allowedChars.random() }.joinToString("")
    } else {
        roomId
    }
    
    // Navega para a sala
    onNavigateToRoom(finalRoomId, userName)
}
