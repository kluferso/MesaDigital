package com.mesadigital.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Send
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mesadigital.model.ChatMessage
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

/**
 * Painel de chat para a sala com design moderno
 */
@Composable
fun ChatPanel(
    messages: List<ChatMessage>,
    onSendMessage: (String) -> Unit,
    onClose: () -> Unit,
    modifier: Modifier = Modifier
) {
    val focusManager = LocalFocusManager.current
    var messageText by remember { mutableStateOf("") }
    val scrollState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()
    
    // Efeito para rolar para a última mensagem quando novas mensagens são recebidas
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            scrollState.animateScrollToItem(messages.size - 1)
        }
    }
    
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colors.background.copy(alpha = 0.95f))
    ) {
        Card(
            modifier = Modifier
                .fillMaxHeight()
                .fillMaxWidth(0.85f)
                .align(Alignment.CenterEnd),
            elevation = 8.dp,
            shape = RoundedCornerShape(topStart = 16.dp, bottomStart = 16.dp)
        ) {
            Column(
                modifier = Modifier.fillMaxSize()
            ) {
                // Cabeçalho
                TopAppBar(
                    title = {
                        Text(
                            text = "Chat",
                            style = MaterialTheme.typography.h6,
                            fontWeight = FontWeight.Bold
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = onClose) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Fechar chat"
                            )
                        }
                    },
                    backgroundColor = MaterialTheme.colors.primary,
                    elevation = 4.dp
                )
                
                // Lista de mensagens
                if (messages.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth()
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "Nenhuma mensagem ainda",
                                style = MaterialTheme.typography.body1,
                                fontWeight = FontWeight.Medium
                            )
                            
                            Spacer(modifier = Modifier.height(8.dp))
                            
                            Text(
                                text = "Envie a primeira mensagem para a sala",
                                style = MaterialTheme.typography.caption,
                                color = MaterialTheme.colors.onSurface.copy(alpha = 0.7f),
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth(),
                        state = scrollState,
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(messages) { message ->
                            MessageItem(
                                message = message
                            )
                        }
                    }
                }
                
                // Campo de entrada de mensagem
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(MaterialTheme.colors.surface)
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Campo de texto
                    TextField(
                        value = messageText,
                        onValueChange = { messageText = it },
                        placeholder = { Text("Digite sua mensagem...") },
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(24.dp)),
                        singleLine = true,
                        colors = TextFieldDefaults.textFieldColors(
                            backgroundColor = MaterialTheme.colors.background,
                            focusedIndicatorColor = Color.Transparent,
                            unfocusedIndicatorColor = Color.Transparent
                        ),
                        keyboardOptions = KeyboardOptions.Default.copy(
                            imeAction = ImeAction.Send
                        ),
                        keyboardActions = KeyboardActions(
                            onSend = {
                                if (messageText.isNotBlank()) {
                                    onSendMessage(messageText)
                                    messageText = ""
                                    focusManager.clearFocus()
                                }
                            }
                        )
                    )
                    
                    Spacer(modifier = Modifier.width(12.dp))
                    
                    // Botão de enviar
                    IconButton(
                        onClick = {
                            if (messageText.isNotBlank()) {
                                onSendMessage(messageText)
                                messageText = ""
                                focusManager.clearFocus()
                                
                                // Rolar para a última mensagem
                                coroutineScope.launch {
                                    scrollState.animateScrollToItem(messages.size)
                                }
                            }
                        },
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(
                                if (messageText.isBlank()) 
                                    MaterialTheme.colors.primary.copy(alpha = 0.5f) 
                                else 
                                    MaterialTheme.colors.primary
                            )
                    ) {
                        Icon(
                            imageVector = Icons.Default.Send,
                            contentDescription = "Enviar",
                            tint = Color.White
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun MessageItem(
    message: ChatMessage,
    modifier: Modifier = Modifier
) {
    val dateFormat = remember { SimpleDateFormat("HH:mm", Locale.getDefault()) }
    val formattedTime = remember(message.timestamp) { 
        dateFormat.format(Date(message.timestamp))
    }
    
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = if (message.isLocalUser) Alignment.End else Alignment.Start
    ) {
        // Nome do remetente
        Text(
            text = if (message.isLocalUser) "Você" else message.senderName,
            style = MaterialTheme.typography.caption,
            color = if (message.isLocalUser) MaterialTheme.colors.primary else MaterialTheme.colors.secondary,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 8.dp)
        )
        
        // Conteúdo da mensagem
        Card(
            modifier = Modifier
                .widthIn(max = 280.dp)
                .padding(top = 2.dp),
            backgroundColor = if (message.isLocalUser) 
                MaterialTheme.colors.primary.copy(alpha = 0.2f) 
            else 
                MaterialTheme.colors.surface,
            elevation = 1.dp,
            shape = RoundedCornerShape(
                topStart = if (!message.isLocalUser) 0.dp else 8.dp,
                topEnd = if (message.isLocalUser) 0.dp else 8.dp,
                bottomStart = 8.dp,
                bottomEnd = 8.dp
            )
        ) {
            Column(
                modifier = Modifier.padding(12.dp)
            ) {
                Text(
                    text = message.text,
                    style = MaterialTheme.typography.body1
                )
                
                Text(
                    text = formattedTime,
                    style = MaterialTheme.typography.caption,
                    color = MaterialTheme.colors.onSurface.copy(alpha = 0.6f),
                    modifier = Modifier
                        .align(Alignment.End)
                        .padding(top = 4.dp)
                )
            }
        }
    }
}
